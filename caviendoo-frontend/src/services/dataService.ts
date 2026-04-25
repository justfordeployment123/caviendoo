/**
 * Data service — M2 live API implementation.
 * All function signatures are identical to M1; only the implementations change.
 * Components are untouched.
 */

import type {
  Fruit, Governorate, SiteMetrics, FruitFilters, Locale,
  CurrentWeather, ClimateClimatology, BiodiversityData, ProductionData, LiveEnvironmentalData,
} from '@/types';

const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || '';
const API_BASE = NEXT_PUBLIC_API_URL.endsWith('/api/v1') ? NEXT_PUBLIC_API_URL : `${NEXT_PUBLIC_API_URL}/api/v1`;

async function apiFetch<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
): Promise<T> {
  const url = new URL(API_BASE + path);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '' && v !== false) {
        url.searchParams.set(k, String(v));
      }
    }
  }
  const res = await fetch(url.toString(), { next: { revalidate: 60 } } as RequestInit);
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

export async function getFruits(filters?: FruitFilters): Promise<Fruit[]> {
  const { data } = await apiFetch<{ data: Fruit[] }>('/fruits', {
    category:     filters?.category,
    aocOnly:      filters?.aocOnly ? 'true' : undefined,
    heritageOnly: filters?.heritageOnly ? 'true' : undefined,
    governorate:  filters?.governorate,
    limit:        100,
  });
  return data;
}

export async function getFruitById(id: string): Promise<Fruit | null> {
  try {
    return await apiFetch<Fruit>(`/fruits/${encodeURIComponent(id)}`);
  } catch {
    return null;
  }
}

export async function getGovernorates(): Promise<Governorate[]> {
  const { data } = await apiFetch<{ data: Governorate[] }>('/regions', { country: 'TN' });
  return data;
}

export async function getGovernorateByName(shapeName: string): Promise<Governorate | null> {
  try {
    return await apiFetch<Governorate>(`/governorates/${encodeURIComponent(shapeName)}`);
  } catch {
    return null;
  }
}

export async function getFruitsByGovernorate(shapeName: string): Promise<Fruit[]> {
  return getFruits({ governorate: shapeName });
}

export async function getMetrics(): Promise<SiteMetrics> {
  return apiFetch<SiteMetrics>('/metrics');
}

export async function searchFruits(query: string, locale: Locale): Promise<Fruit[]> {
  if (!query.trim()) return [];
  const { data } = await apiFetch<{ data: Fruit[] }>('/search', {
    q:      query,
    locale,
    limit:  10,
  });
  return data;
}

export async function getGovernorateWeather(
  shapeName: string,
): Promise<{ weather: CurrentWeather; climate: ClimateClimatology } | null> {
  try {
    return await apiFetch<{ weather: CurrentWeather; climate: ClimateClimatology }>(
      `/weather/governorate/${encodeURIComponent(shapeName)}`,
    );
  } catch {
    return null;
  }
}

export async function getFruitBiodiversity(fruitId: string): Promise<BiodiversityData | null> {
  try {
    return await apiFetch<BiodiversityData>(`/live/fruits/${encodeURIComponent(fruitId)}/biodiversity`);
  } catch {
    return null;
  }
}

export async function getFruitProduction(fruitId: string): Promise<ProductionData | null> {
  try {
    return await apiFetch<ProductionData>(`/live/fruits/${encodeURIComponent(fruitId)}/production`);
  } catch {
    return null;
  }
}

export async function getFruitLiveEnvironmental(fruitId: string): Promise<LiveEnvironmentalData | null> {
  try {
    return await apiFetch<LiveEnvironmentalData>(
      `/live/fruits/${encodeURIComponent(fruitId)}/environmental`,
    );
  } catch {
    return null;
  }
}

export async function getFruitLiveNutrition(
  fruitId: string,
): Promise<{ source: string; fields: Array<{ label: { en: string; fr: string; ar: string }; value: string; sortOrder: number }> } | null> {
  try {
    return await apiFetch<{ source: string; fields: Array<{ label: { en: string; fr: string; ar: string }; value: string; sortOrder: number }> }>(
      `/live/fruits/${encodeURIComponent(fruitId)}/nutrition`,
    );
  } catch {
    return null;
  }
}

export function getLocalizedString(
  obj: { en: string; fr: string; ar: string },
  locale: Locale,
): string {
  return obj[locale] || obj.en;
}
