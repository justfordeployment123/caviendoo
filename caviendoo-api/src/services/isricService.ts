/**
 * ISRIC SoilGrids v2.0 — global soil property maps at 250m resolution.
 * https://rest.soilgrids.org/soilgrids/v2.0/properties/query
 * Free, no API key required.
 */

export interface SoilData {
  soilPhTypical:        number | null;  // pH × 10 in SoilGrids, returned as real pH
  soilTexture:          string | null;  // derived from clay/sand/silt %
  soilOrganicCarbonPct: number | null;  // g/kg → %
}

// Map SoilGrids texture fractions to a human-readable class name
function textureClass(clay: number, sand: number): string {
  if (clay > 55) return 'clay';
  if (clay > 35 && sand < 45) return 'clay';
  if (clay > 27 && sand < 45) return 'clay loam';
  if (sand > 70 && clay < 15) return 'sandy';
  if (sand > 50 && clay < 20) return 'sandy loam';
  if (clay < 27 && sand < 50) return 'loam';
  return 'loam';
}

export async function getSoilData(lat: number, lng: number): Promise<SoilData> {
  // Request pH, clay %, sand %, silt %, organic carbon at 0-30cm depth
  const properties = 'phh2o,clay,sand,silt,soc';
  const depths     = '0-5cm,5-15cm,15-30cm';
  const values     = 'mean';

  const url = `https://rest.isric.org/soilgrids/v2.0/properties/query?lon=${lng}&lat=${lat}&property=${properties}&depth=${depths}&value=${values}`;

  const res = await fetch(url, { signal: AbortSignal.timeout(12_000) });
  if (!res.ok) {
    return { soilPhTypical: null, soilTexture: null, soilOrganicCarbonPct: null };
  }

  const json = await res.json() as any;
  const layers: any[] = json.properties?.layers ?? [];

  function meanOfDepths(propName: string): number | null {
    const layer = layers.find((l: any) => l.name === propName);
    if (!layer) return null;
    const vals = (layer.depths as any[])
      .map((d: any) => d.values?.mean)
      .filter((v: any) => v != null && v !== -32768);
    if (!vals.length) return null;
    return vals.reduce((a: number, b: number) => a + b, 0) / vals.length;
  }

  const phRaw  = meanOfDepths('phh2o');  // SoilGrids pH × 10
  const clay   = meanOfDepths('clay');   // g/kg → /10 for %
  const sand   = meanOfDepths('sand');
  const socRaw = meanOfDepths('soc');    // dg/kg

  const ph  = phRaw  != null ? Math.round((phRaw  / 10) * 10) / 10 : null;
  const soc = socRaw != null ? Math.round((socRaw / 100) * 100) / 100 : null; // dg/kg → %

  let texture: string | null = null;
  if (clay != null && sand != null) {
    const clayPct = clay / 10;
    const sandPct = sand / 10;
    texture = textureClass(clayPct, sandPct);
  }

  return {
    soilPhTypical:        ph,
    soilTexture:          texture,
    soilOrganicCarbonPct: soc,
  };
}
