import { fetch } from 'undici';
import { env } from '../config/env';

export interface UvForecastResult {
  uv: number;
  uv_max: number;
  uv_max_time: string;
  ozone: number;
  safe_exposure_time: Record<string, number>;
  sun_info: {
    sun_times: { dawn: string; dusk: string };
    sun_position: { azimuth: number; altitude: number };
  };
}

export async function fetchUvForecast(lat: number, lng: number): Promise<UvForecastResult> {
  const url = `https://api.openuv.io/api/v1/uv?lat=${lat}&lng=${lng}`;

  const res = await fetch(url, {
    headers: {
      'x-access-token': env.OPENUV_API_KEY,
      'Content-Type':   'application/json',
    },
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`OpenUV API ${res.status}: ${body}`);
  }

  const data = (await res.json()) as { result: UvForecastResult };
  return data.result;
}
