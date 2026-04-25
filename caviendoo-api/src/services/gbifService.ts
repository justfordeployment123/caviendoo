/**
 * GBIF — Global Biodiversity Information Facility.
 * https://api.gbif.org/v1
 * Free, no API key required. 1.5 billion occurrence records worldwide.
 */

export interface BiodiversityData {
  globalOccurrences:  number;
  tunisiaOccurrences: number;
  earliestRecord:     number | null;
  latestRecord:       number | null;
  kingdom:            string | null;
  family:             string | null;
  genus:              string | null;
  taxonKey:           number | null;
  iucnCategory:       string | null;
}

export async function getBiodiversityData(latinName: string): Promise<BiodiversityData> {
  // Step 1: resolve the taxon key from the species name
  const matchRes  = await fetch(
    `https://api.gbif.org/v1/species/match?name=${encodeURIComponent(latinName)}&kingdom=Plantae`,
    { signal: AbortSignal.timeout(8_000) },
  );
  const matchJson = matchRes.ok ? (await matchRes.json() as any) : {};

  const taxonKey    = matchJson.usageKey  ?? matchJson.speciesKey ?? null;
  const kingdom     = matchJson.kingdom   ?? null;
  const family      = matchJson.family    ?? null;
  const genus       = matchJson.genus     ?? null;
  const iucn        = matchJson.iucnRedListCategory ?? null;

  // Step 2: global occurrences
  let globalCount = 0;
  if (taxonKey) {
    const globalRes = await fetch(
      `https://api.gbif.org/v1/occurrence/search?taxonKey=${taxonKey}&limit=0`,
      { signal: AbortSignal.timeout(8_000) },
    );
    if (globalRes.ok) {
      const gj   = await globalRes.json() as any;
      globalCount = gj.count ?? 0;
    }
  }

  // Step 3: Tunisia-specific occurrences
  let tunisiaCount = 0;
  if (taxonKey) {
    const tnRes = await fetch(
      `https://api.gbif.org/v1/occurrence/search?taxonKey=${taxonKey}&country=TN&limit=0`,
      { signal: AbortSignal.timeout(8_000) },
    );
    if (tnRes.ok) {
      const tj    = await tnRes.json() as any;
      tunisiaCount = tj.count ?? 0;
    }
  }

  // Step 4: earliest & latest records in Tunisia
  let earliest: number | null = null;
  let latest:   number | null = null;
  if (taxonKey && tunisiaCount > 0) {
    const yearRes = await fetch(
      `https://api.gbif.org/v1/occurrence/search?taxonKey=${taxonKey}&country=TN&limit=1&facet=year&facetLimit=1&facetMincount=1`,
      { signal: AbortSignal.timeout(8_000) },
    );
    if (yearRes.ok) {
      const yj = await yearRes.json() as any;
      const yearFacet = yj.facets?.find((f: any) => f.field === 'YEAR')?.counts;
      if (yearFacet?.length) {
        const years = yearFacet.map((y: any) => Number(y.name)).filter((y: number) => y > 1800);
        if (years.length) {
          earliest = Math.min(...years);
          latest   = Math.max(...years);
        }
      }
    }
  }

  return {
    globalOccurrences:  globalCount,
    tunisiaOccurrences: tunisiaCount,
    earliestRecord:     earliest,
    latestRecord:       latest,
    kingdom,
    family,
    genus,
    taxonKey,
    iucnCategory:       iucn,
  };
}
