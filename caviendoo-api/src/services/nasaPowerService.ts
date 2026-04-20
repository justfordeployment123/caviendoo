import { fetch } from 'undici';

export interface NASAPowerParams {
  lat: number;
  lng: number;
  startDate: string; // YYYYMMDD
  endDate: string;   // YYYYMMDD
}

export interface NASAPowerResult {
  T2M_MAX: Record<string, number>;      // max 2m air temp (°C) per date
  PRECTOTCORR: Record<string, number>;  // corrected precipitation (mm) per date
  ALLSKY_SFC_SW_DWN: Record<string, number>; // solar radiation (kWh/m²/day) per date
}

const PARAMETERS = ['T2M_MAX', 'PRECTOTCORR', 'ALLSKY_SFC_SW_DWN'].join(',');

export async function fetchNASAPower(params: NASAPowerParams): Promise<NASAPowerResult> {
  const { lat, lng, startDate, endDate } = params;

  const url =
    `https://power.larc.nasa.gov/api/temporal/daily/point` +
    `?parameters=${PARAMETERS}` +
    `&community=AG` +
    `&longitude=${lng}` +
    `&latitude=${lat}` +
    `&start=${startDate}` +
    `&end=${endDate}` +
    `&format=JSON`;

  const res = await fetch(url, {
    signal: AbortSignal.timeout(30_000),
  });

  if (!res.ok) {
    throw new Error(`NASA POWER API ${res.status}`);
  }

  const data = (await res.json()) as { properties: { parameter: NASAPowerResult } };
  return data.properties.parameter;
}

export function averageValues(values: Record<string, number>): number {
  const nums = Object.values(values).filter((v) => v !== -999); // -999 = missing data
  if (nums.length === 0) return 0;
  return nums.reduce((s, v) => s + v, 0) / nums.length;
}
