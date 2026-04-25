/**
 * NASA POWER API — 30-year climatological averages, free, no key required.
 * https://power.larc.nasa.gov/api/temporal/climatology/point
 */

import { fetch } from 'undici';

const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'] as const;

export interface ClimateClimatology {
  uvIndexPeak:      number;  // peak monthly UV (1–11)
  uvIndexAnnual:    number;  // annual mean UV
  precipMmDay:      number;  // mean daily precipitation (mm/day)
  precipMmYear:     number;  // annual total (mm/year)
  tempCMean:        number;  // mean annual temperature (°C)
  tempCMax:         number;  // mean warmest month (°C)
  tempCMin:         number;  // mean coldest month (°C)
  humidityPct:      number;  // mean relative humidity (%)
  petMmYear:        number;  // estimated PET via Blaney-Criddle (mm/year)
  aridityIndex:     number;  // P/PET — lower = drier
  aquiferStressPct: number;  // 0–100 derived from aridity
  monthly: {
    uv:     number[];  // [12] monthly UV index
    precip: number[];  // [12] monthly precip mm/day
    temp:   number[];  // [12] monthly temp °C
  };
}

function estimatePET(tMean: number): number {
  // Blaney-Criddle simplified, p=0.29 for ~33°N (Tunisia)
  return 0.29 * (0.46 * tMean + 8.13) * 365;
}

function aridityToStress(ai: number): number {
  if (ai >= 0.65) return Math.round(5  + (Math.min(ai, 1.0) - 0.65) * -33);
  if (ai >= 0.50) return Math.round(20 + (0.65 - ai) / 0.15 * 15);
  if (ai >= 0.20) return Math.round(35 + (0.50 - ai) / 0.30 * 25);
  if (ai >= 0.05) return Math.round(60 + (0.20 - ai) / 0.15 * 25);
  return Math.min(100, Math.round(85 + (0.05 - ai) / 0.05 * 15));
}

export async function getClimateClimatology(lat: number, lng: number): Promise<ClimateClimatology> {
  const params = new URLSearchParams({
    latitude:   String(lat),
    longitude:  String(lng),
    community:  'AG',
    parameters: 'ALLSKY_SFC_UV_INDEX,T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,RH2M',
    format:     'JSON',
    header:     'true',
  });

  const res = await fetch(
    `https://power.larc.nasa.gov/api/temporal/climatology/point?${params}`,
    { signal: AbortSignal.timeout(45_000) },
  );
  if (!res.ok) throw new Error(`NASA POWER ${res.status}`);

  const json  = await res.json() as any;
  const param = json.properties?.parameter ?? {};

  const uvData  = param['ALLSKY_SFC_UV_INDEX'] ?? {};
  const t2m     = param['T2M']                 ?? {};
  const t2mMax  = param['T2M_MAX']             ?? {};
  const t2mMin  = param['T2M_MIN']             ?? {};
  const precipP = param['PRECTOTCORR']         ?? {};
  const rh      = param['RH2M']                ?? {};

  const monthlyUV  = MONTHS.map((m) => uvData[m]  ?? 0);
  const monthlyT   = MONTHS.map((m) => t2m[m]    ?? 0);
  const monthlyPr  = MONTHS.map((m) => precipP[m] ?? 0);

  const uvAnnual   = uvData['ANN']   ?? monthlyUV.reduce((a, b) => a + b, 0) / 12;
  const uvPeak     = Math.max(...monthlyUV);
  const tMean      = t2m['ANN']      ?? monthlyT.reduce((a, b) => a + b, 0) / 12;
  const tMax       = Math.max(...MONTHS.map((m) => t2mMax[m] ?? 0));
  const tMin       = Math.min(...MONTHS.map((m) => t2mMin[m] ?? 0));
  const precipDay  = precipP['ANN']  ?? monthlyPr.reduce((a, b) => a + b, 0) / 12;
  const precipYear = precipDay * 365.25;
  const humidity   = rh['ANN']       ?? 50;

  const petYear = estimatePET(tMean);
  const ai      = petYear > 0 ? precipYear / petYear : 0;

  return {
    uvIndexPeak:      Math.max(1, Math.min(11, Math.round(uvPeak))),
    uvIndexAnnual:    Math.round(uvAnnual * 10) / 10,
    precipMmDay:      Math.round(precipDay * 100) / 100,
    precipMmYear:     Math.round(precipYear),
    tempCMean:        Math.round(tMean * 10) / 10,
    tempCMax:         Math.round(tMax  * 10) / 10,
    tempCMin:         Math.round(tMin  * 10) / 10,
    humidityPct:      Math.round(humidity),
    petMmYear:        Math.round(petYear),
    aridityIndex:     Math.round(ai * 1000) / 1000,
    aquiferStressPct: Math.max(5, Math.min(100, aridityToStress(ai))),
    monthly: { uv: monthlyUV, precip: monthlyPr, temp: monthlyT },
  };
}

export interface WaterFootprint {
  blueWaterLkg:  number;
  greenWaterLkg: number;
  totalWaterLkg: number;
}

export function calcWaterFootprint(
  climate:     ClimateClimatology,
  Kc:          number,
  yieldKgHa:   number,
): WaterFootprint {
  const cropET    = climate.petMmYear * Kc;
  const effRain   = climate.precipMmYear * 0.75;
  const green     = Math.min(effRain, cropET);
  const blue      = Math.max(0, cropET - effRain);
  const factor    = 10000 / Math.max(yieldKgHa, 1); // m³/ha per mm → L/kg
  return {
    blueWaterLkg:  Math.max(1, Math.round(blue  * factor)),
    greenWaterLkg: Math.max(1, Math.round(green * factor)),
    totalWaterLkg: Math.max(2, Math.round(cropET * factor)),
  };
}
