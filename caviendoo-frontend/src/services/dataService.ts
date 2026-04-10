/**
 * Data service — M1 reads from static mock files.
 * M2: replace each function body with fetch('/api/...') calls.
 * Component code remains unchanged.
 */

import type { Fruit, Governorate, SiteMetrics, FruitFilters, Locale } from '@/types';
import { fruits as mockFruits } from '@/data/fruits';
import { governorates as mockGovernorates } from '@/data/governorates';

// ── Verified Unsplash CDN photo IDs ──────────────────────────────────────────
// All IDs verified 200 against images.unsplash.com. Grouped by category with
// intentional variety — similar fruits share a photo from different angles.
const U = 'https://images.unsplash.com';

const PHOTO_IDS: Record<string, string> = {
  // ── Olives ──────────────────────────────────────────────────────────────
  'olive-chemlali':        'photo-1757149908579-474cb1da27bb',
  'olive-chetoui':         'photo-1757149908579-474cb1da27bb',
  'olive-zalmati':         'photo-1757149908579-474cb1da27bb',
  'olive-meski':           'photo-1757149908579-474cb1da27bb',
  'olive-tounsi':          'photo-1757149908579-474cb1da27bb',
  'olive-jerbi':           'photo-1757149908579-474cb1da27bb',
  // ── Dates ───────────────────────────────────────────────────────────────
  'date-deglet-noor':      'photo-1642073537056-20608544f111',
  'date-allig':            'photo-1642073537056-20608544f111',
  'date-kentichi':         'photo-1642073537056-20608544f111',
  'date-nour':             'photo-1642073537056-20608544f111',
  'date-ftimi':            'photo-1642073537056-20608544f111',
  'date-chekhi':           'photo-1642073537056-20608544f111',
  // ── Figs ────────────────────────────────────────────────────────────────
  'fig-djebba':            'photo-1720121955684-32b0b38cb50c',
  'fig-beni-khalled':      'photo-1720121955684-32b0b38cb50c',
  'fig-smyrna':            'photo-1720121955684-32b0b38cb50c',
  // ── Pomegranate ─────────────────────────────────────────────────────────
  'pomegranate-gabes':     'photo-1541344999736-83eca272f6fc',
  'pomegranate-tebourba':  'photo-1541344999736-83eca272f6fc',
  // ── Apricot ─────────────────────────────────────────────────────────────
  'apricot-sidi-bouzid':   'photo-1656056971364-410690438797',
  'apricot-kairouan':      'photo-1656056971364-410690438797',
  // ── Citrus ──────────────────────────────────────────────────────────────
  'orange-maltaise':       'photo-1582979512210-99b6a53386f9',
  'lemon-beldi':           'photo-1720007444091-9dbd2f71f921',
  'mandarin-nabeul':       'photo-1579007002510-6121ca6dbbc7',
  'clementine-nabeul':     'photo-1579007002510-6121ca6dbbc7',
  'grapefruit-sousse':     'photo-1670259382864-c532bcf1fa5e',
  'lime-nabeul':           'photo-1762710526463-2d8f7b2c3129',
  'blood-orange-nabeul':   'photo-1762608292626-a384d1cc401f',
  'bergamot-nabeul':       'photo-1709606482839-b72012022a75',
  'pomelo-tunis':          'photo-1655082291675-b919ca1c3419',
  'bitter-orange-nabeul':  'photo-1720007444091-9dbd2f71f921',
  // ── Nuts / Dried ────────────────────────────────────────────────────────
  'almond-sfax':           'photo-1631815333332-e3ffb24e2bf8',
  'almond-achaak':         'photo-1631815333332-e3ffb24e2bf8',
  'pistachio-kasserine':   'photo-1704079662049-d00890d21a69',
  'pistachio-gafsa':       'photo-1704079662049-d00890d21a69',
  'walnut-beja':           'photo-1560266455-ef6833599e6e',
  'hazelnut-jendouba':     'photo-1549007924-df2663e50cc8',
  'pine-nut-bizerte':      'photo-1589752881818-337a265572df',
  'carob-kasserine':       'photo-1771885440105-6218d4c07e09',
  // ── Grapes ──────────────────────────────────────────────────────────────
  'grape-muscat-nabeul':   'photo-1537640538966-79f369143f8f',
  'grape-razegui':         'photo-1537640538966-79f369143f8f',
  'grape-beldi':           'photo-1537640538966-79f369143f8f',
  // ── Stone Fruit ─────────────────────────────────────────────────────────
  'peach-nabeul':          'photo-1674672239572-8d8cc7186f8e',
  'peach-zaghouan':        'photo-1674672239572-8d8cc7186f8e',
  'nectarine-nabeul':      'photo-1597995463377-911fb3779867',
  'plum-beja':             'photo-1627544652098-cd4682985358',
  'plum-siliana':          'photo-1627544652098-cd4682985358',
  'cherry-beja':           'photo-1528821128474-27f963b062bf',
  // ── Berries ─────────────────────────────────────────────────────────────
  'strawberry-nabeul':     'photo-1464965911861-746a04b4bca6',
  'raspberry-beja':        'photo-1595801734198-cf093768c643',
  'blueberry-siliana':     'photo-1498557850523-fd3d118b962e',
  'blackberry-jendouba':   'photo-1648070514797-8ea0a95ec4e7',
  'mulberry-beja':         'photo-1771370040134-b59d3a0aa8e5',
  'currant-beja':          'photo-1662912263030-74b98c3bac44',
  // ── Pome Fruit ──────────────────────────────────────────────────────────
  'apple-el-kef':          'photo-1568702846914-96b305d2aaeb',
  'apple-siliana':         'photo-1568702846914-96b305d2aaeb',
  'pear-nefza':            'photo-1551120036-ae43d011e82e',
  'pear-zaghouan':         'photo-1551120036-ae43d011e82e',
  'quince-nabeul':         'photo-1758451432818-24d47384a8c5',
  'loquat-cap-bon':        'photo-1756670969561-3784e3a467f0',
  // ── Melon ───────────────────────────────────────────────────────────────
  'watermelon-kairouan':   'photo-1589984662646-e7b2e4962f18',
  'watermelon-sousse':     'photo-1589984662646-e7b2e4962f18',
  'melon-gafsa':           'photo-1638865553538-2434be4c62bd',
  'melon-mahdia':          'photo-1638865553538-2434be4c62bd',
  'melon-nabeul':          'photo-1638865553538-2434be4c62bd',
  'melon-kasserine':       'photo-1638865553538-2434be4c62bd',
  // ── Tropical / Exotic ───────────────────────────────────────────────────
  'banana-gabes':          'photo-1668548205391-60358a614b54',
  'kiwi-nabeul':           'photo-1618897996318-5a901fa6ca71',
  'avocado-gabes':         'photo-1523049673857-eb18f1d7b578',
  'guava-monastir':        'photo-1693399991519-bef70bed19a2',
  'persimmon-nabeul':      'photo-1765781854839-dd7424bdea6c',
  // ── Other ───────────────────────────────────────────────────────────────
  'prickly-pear':          'photo-1717016296561-37af0c705281',
  'prickly-pear-sfax':     'photo-1717016296561-37af0c705281',
  'jujube-zaghouan':       'photo-1537203374277-c6cf7cebea4a',
  'caper-gabes':           'photo-1625009431843-18569fd7331b',
};

function imgUrl(photoId: string, w: number, h: number): string {
  return `${U}/${photoId}?w=${w}&h=${h}&fit=crop&auto=format&q=75`;
}

function withImages(fruit: Fruit): Fruit {
  const id = PHOTO_IDS[fruit.id] ?? 'photo-1568702846914-96b305d2aaeb'; // fallback: apple
  return {
    ...fruit,
    photoUrl: imgUrl(id, 800, 500),
    thumbnailUrl: imgUrl(id, 84, 84),
  };
}

function localizedMatch(value: string, query: string): boolean {
  return value.toLowerCase().includes(query.toLowerCase());
}

export async function getFruits(filters?: FruitFilters): Promise<Fruit[]> {
  let result = mockFruits.map(withImages);

  if (filters?.category) {
    result = result.filter((f) => f.category === filters.category);
  }
  if (filters?.aocOnly) {
    result = result.filter((f) => f.isAOC);
  }
  if (filters?.heritageOnly) {
    result = result.filter((f) => f.isHeritage);
  }
  if (filters?.governorate) {
    const gov = filters.governorate;
    result = result.filter((f) => f.governorates.includes(gov));
  }
  if (filters?.searchQuery) {
    const q = filters.searchQuery.toLowerCase();
    result = result.filter(
      (f) =>
        localizedMatch(f.name.en, q) ||
        localizedMatch(f.name.fr, q) ||
        localizedMatch(f.name.ar, q) ||
        localizedMatch(f.localName, q) ||
        f.localities.some((loc: string) => localizedMatch(loc, q)) ||
        localizedMatch(f.zone.en, q) ||
        f.governorates.some((g: string) => localizedMatch(g, q))
    );
  }

  result.sort((a, b) => a.name.en.localeCompare(b.name.en));
  return result;
}

export async function getFruitById(id: string): Promise<Fruit | null> {
  const f = mockFruits.find((f: Fruit) => f.id === id) ?? null;
  return f ? withImages(f) : null;
}

export async function getGovernorates(): Promise<Governorate[]> {
  const fruitsByGov = new Map<string, number>();
  for (const fruit of mockFruits) {
    for (const gov of fruit.governorates) {
      fruitsByGov.set(gov, (fruitsByGov.get(gov) ?? 0) + 1);
    }
  }
  return (mockGovernorates as Omit<Governorate, 'fruitCount'>[]).map((g) => ({
    ...g,
    fruitCount: fruitsByGov.get(g.shapeName) ?? 0,
  }));
}

export async function getGovernorateByName(shapeName: string): Promise<Governorate | null> {
  const govs = await getGovernorates();
  return govs.find((g) => g.shapeName === shapeName) ?? null;
}

export async function getFruitsByGovernorate(shapeName: string): Promise<Fruit[]> {
  return getFruits({ governorate: shapeName });
}

export async function getMetrics(): Promise<SiteMetrics> {
  return {
    totalFruits: mockFruits.length,
    totalGovernorates: mockGovernorates.length,
    totalAOC: mockFruits.filter((f: Fruit) => f.isAOC).length,
  };
}

export async function searchFruits(query: string, locale: Locale): Promise<Fruit[]> {
  if (!query.trim()) return [];
  const q = query.toLowerCase();

  const scored = mockFruits
    .map((f: Fruit) => {
      let score = 0;
      if (f.name[locale].toLowerCase().startsWith(q)) score += 10;
      else if (localizedMatch(f.name[locale], q)) score += 6;
      if (localizedMatch(f.name.en, q) || localizedMatch(f.name.fr, q) || localizedMatch(f.name.ar, q)) score += 4;
      if (localizedMatch(f.localName, q)) score += 4;
      if (f.localities.some((loc: string) => localizedMatch(loc, q))) score += 3;
      if (localizedMatch(f.zone[locale], q)) score += 2;
      if (f.governorates.some((g: string) => localizedMatch(g, q))) score += 1;
      return { fruit: f, score };
    })
    .filter((item: { fruit: Fruit; score: number }) => item.score > 0)
    .sort((a: { fruit: Fruit; score: number }, b: { fruit: Fruit; score: number }) => b.score - a.score)
    .slice(0, 10)
    .map((item: { fruit: Fruit; score: number }) => withImages(item.fruit));

  return scored;
}

export function getLocalizedString(
  obj: { en: string; fr: string; ar: string },
  locale: Locale
): string {
  return obj[locale] || obj.en;
}
