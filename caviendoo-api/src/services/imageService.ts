import Anthropic from '@anthropic-ai/sdk';
import { fetch } from 'undici';
import { prisma } from '../config/db';
import { processAndUploadImage } from './imageProcessor';
import { env } from '../config/env';

type ImageSource = 'pixabay' | 'unsplash' | 'pexels' | 'wikimedia';

interface ImageCandidate {
  sourceId:    string;
  source:      ImageSource;
  downloadUrl: string; // high-res URL for S3 upload
  scoreUrl:    string; // smaller URL for AI scoring (faster)
  pageUrl:     string;
  authorName:  string;
  authorUrl:   string;
  license:     string;
  width:       number;
  height:      number;
  keywordScore: number; // fallback score when AI is unavailable
}

// ── Keyword pre-filter score (used to pick candidates before AI scoring) ──────

function keywordScore(query: string, tagString: string, width = 0, height = 0): number {
  const queryWords  = query.toLowerCase().split(/\s+/);
  const tags        = tagString.toLowerCase();
  const matched     = queryWords.filter((w) => tags.includes(w)).length;
  const relevance   = Math.min(1, 0.3 + (matched / queryWords.length) * 0.7);
  const aspectBonus = width > 0 && height > 0 && width > height ? 0.05 : 0;
  return Math.min(1, relevance + aspectBonus);
}

// ── AI scoring via Claude vision ───────────────────────────────────────────────
// Uses claude-haiku for speed and cost-efficiency (~$0.001 per fruit total).
// Returns a 0.0–1.0 score. Falls back to keywordScore on any error.

let anthropicClient: Anthropic | null = null;

function getAnthropic(): Anthropic | null {
  if (!env.ANTHROPIC_API_KEY) return null;
  if (!anthropicClient) anthropicClient = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  return anthropicClient;
}

async function scoreWithAI(
  candidate: ImageCandidate,
  fruitNameEn: string,
  latinName: string,
): Promise<number> {
  const client = getAnthropic();
  if (!client) return candidate.keywordScore;

  try {
    const msg = await client.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 10,
      messages: [{
        role: 'user',
        content: [
          {
            type:   'image',
            source: { type: 'url', url: candidate.scoreUrl },
          },
          {
            type: 'text',
            text: `Rate this image for a premium fruit encyclopedia.
Fruit: "${fruitNameEn}" (${latinName})

Score 0.0–1.0:
1.0 = Crisp, food-catalog-quality photo of exactly this fruit
0.8 = Clear photo of this fruit, good quality
0.6 = Recognisably this fruit but imperfect composition or quality
0.4 = Ambiguous — may be a related fruit or unclear
0.1 = Wrong fruit, illustration, map, or irrelevant image

Reply with a single decimal number only. No words.`,
          },
        ],
      }],
    });

    const raw   = (msg.content[0] as Anthropic.TextBlock).text.trim();
    const score = parseFloat(raw);
    return isNaN(score) ? candidate.keywordScore : Math.max(0, Math.min(1, score));
  } catch {
    return candidate.keywordScore;
  }
}

// ── Pixabay ───────────────────────────────────────────────────────────────────

async function searchPixabay(query: string): Promise<ImageCandidate[]> {
  const url = new URL('https://pixabay.com/api/');
  url.searchParams.set('key',         env.PIXABAY_API_KEY);
  url.searchParams.set('q',           query);
  url.searchParams.set('image_type',  'photo');
  url.searchParams.set('category',    'food');
  url.searchParams.set('safesearch',  'true');
  url.searchParams.set('per_page',    '5');
  url.searchParams.set('min_width',   '800');
  url.searchParams.set('orientation', 'horizontal');

  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8_000) });
  if (!res.ok) return [];

  const data = (await res.json()) as { hits?: any[] };
  return (data.hits ?? []).map((hit: any): ImageCandidate => ({
    sourceId:     String(hit.id),
    source:       'pixabay',
    downloadUrl:  hit.largeImageURL as string,
    scoreUrl:     (hit.webformatURL ?? hit.largeImageURL) as string,
    pageUrl:      hit.pageURL as string,
    authorName:   hit.user as string,
    authorUrl:    `https://pixabay.com/users/${hit.user}-${hit.user_id}/`,
    license:      'Pixabay License',
    width:        hit.imageWidth as number,
    height:       hit.imageHeight as number,
    keywordScore: keywordScore(query, hit.tags ?? '', hit.imageWidth, hit.imageHeight),
  }));
}

// ── Unsplash ──────────────────────────────────────────────────────────────────

async function searchUnsplash(query: string): Promise<ImageCandidate[]> {
  const url =
    `https://api.unsplash.com/search/photos` +
    `?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`;

  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${env.UNSPLASH_ACCESS_KEY}` },
    signal:  AbortSignal.timeout(8_000),
  });
  if (!res.ok) return [];

  const data = (await res.json()) as { results?: any[] };
  return (data.results ?? []).map((photo: any): ImageCandidate => ({
    sourceId:     photo.id as string,
    source:       'unsplash',
    downloadUrl:  (photo.urls?.regular ?? photo.urls?.full) as string,
    scoreUrl:     (photo.urls?.small ?? photo.urls?.regular) as string,
    pageUrl:      `${photo.links?.html}?utm_source=caviendoo&utm_medium=referral`,
    authorName:   photo.user?.name as string,
    authorUrl:    `${photo.user?.links?.html}?utm_source=caviendoo&utm_medium=referral`,
    license:      'Unsplash License',
    width:        photo.width as number,
    height:       photo.height as number,
    keywordScore: keywordScore(
      query,
      (photo.tags ?? []).map((t: any) => t.title ?? '').join(' '),
      photo.width,
      photo.height,
    ),
  }));
}

// ── Pexels ────────────────────────────────────────────────────────────────────

async function searchPexels(query: string): Promise<ImageCandidate[]> {
  const url =
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`;

  const res = await fetch(url, {
    headers: { Authorization: env.PEXELS_API_KEY },
    signal:  AbortSignal.timeout(8_000),
  });
  if (!res.ok) return [];

  const data = (await res.json()) as { photos?: any[] };
  return (data.photos ?? []).map((photo: any): ImageCandidate => ({
    sourceId:     String(photo.id),
    source:       'pexels',
    downloadUrl:  (photo.src?.large2x ?? photo.src?.large) as string,
    scoreUrl:     (photo.src?.medium ?? photo.src?.large) as string,
    pageUrl:      photo.url as string,
    authorName:   photo.photographer as string,
    authorUrl:    photo.photographer_url as string,
    license:      'Pexels License',
    width:        photo.width as number,
    height:       photo.height as number,
    keywordScore: keywordScore(query, query, photo.width, photo.height),
  }));
}

// ── Wikimedia Commons ─────────────────────────────────────────────────────────

async function searchWikimedia(query: string): Promise<ImageCandidate[]> {
  const url = new URL('https://commons.wikimedia.org/w/api.php');
  url.searchParams.set('action',       'query');
  url.searchParams.set('generator',    'search');
  url.searchParams.set('gsrnamespace', '6');
  url.searchParams.set('gsrsearch',    query);
  url.searchParams.set('gsrlimit',     '5');
  url.searchParams.set('prop',         'imageinfo');
  url.searchParams.set('iiprop',       'url|size|extmetadata');
  url.searchParams.set('iiurlwidth',   '1200');
  url.searchParams.set('format',       'json');
  url.searchParams.set('origin',       '*');

  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) return [];

  const data    = (await res.json()) as { query?: { pages?: Record<string, any> } };
  const pages   = Object.values(data.query?.pages ?? {});
  const results: ImageCandidate[] = [];

  for (const page of pages) {
    const info = page.imageinfo?.[0];
    if (!info) continue;

    const w = (info.width  as number) ?? 0;
    const h = (info.height as number) ?? 0;
    if (w < 800) continue;

    const ext        = info.extmetadata ?? {};
    const title      = (page.title as string ?? '').replace('File:', '');
    const desc       = ext.ImageDescription?.value ?? '';
    const cats       = ext.Categories?.value ?? '';
    const tagStr     = `${title} ${desc} ${cats}`.replace(/<[^>]+>/g, ' ');
    const license    = ext.LicenseShortName?.value ?? ext.License?.value ?? 'CC-BY-SA';
    const thumbUrl   = (info.thumburl as string) ?? (info.url as string);
    if (!thumbUrl) continue;

    const authorRaw  = ext.Artist?.value ?? ext.Credit?.value ?? '';
    const authorName = authorRaw.replace(/<[^>]+>/g, '').trim() || 'Wikimedia contributor';
    const encoded    = encodeURIComponent(title);

    results.push({
      sourceId:     String(page.pageid),
      source:       'wikimedia',
      downloadUrl:  thumbUrl,
      scoreUrl:     thumbUrl,
      pageUrl:      `https://commons.wikimedia.org/wiki/File:${encoded}`,
      authorName,
      authorUrl:    `https://commons.wikimedia.org/wiki/File:${encoded}`,
      license,
      width:        w,
      height:       h,
      keywordScore: keywordScore(query, tagStr, w, h),
    });
  }

  return results;
}

// ── Orchestration ─────────────────────────────────────────────────────────────

export async function fetchAndStoreImageForFruit(
  fruitId: string,
  fruitNameEn: string,
  latinName: string,
): Promise<void> {
  const queries = [
    `${fruitNameEn} Tunisia fruit`,
    `${latinName} fruit`,
    `${fruitNameEn} fresh`,
  ];

  const seen       = new Set<string>();
  const candidates: ImageCandidate[] = [];

  for (const q of queries) {
    const [pix, unsp, pex, wiki] = await Promise.allSettled([
      searchPixabay(q),
      searchUnsplash(q),
      searchPexels(q),
      searchWikimedia(q),
    ]);

    for (const result of [pix, unsp, pex, wiki]) {
      if (result.status !== 'fulfilled') continue;
      for (const c of result.value) {
        const key = `${c.source}:${c.sourceId}`;
        if (!seen.has(key) && c.width >= 800) {
          seen.add(key);
          candidates.push(c);
        }
      }
    }

    if (candidates.length >= 5) break;
    await new Promise((r) => setTimeout(r, 300));
  }

  if (candidates.length === 0) {
    console.warn(`[imageService] No candidates found for ${fruitId}`);
    await prisma.fruitImage.create({
      data: {
        fruitId,
        source:       'pixabay',
        sourceId:     'none',
        sourceUrl:    '',
        license:      '',
        status:       'failed',
        isPrimary:    false,
        errorMessage: 'No candidates found from any provider',
      },
    });
    return;
  }

  // Pre-sort by keyword score, take top 5 to AI-score
  const topCandidates = candidates
    .sort((a, b) => b.keywordScore - a.keywordScore)
    .slice(0, 5);

  // AI-score in parallel (falls back to keywordScore if ANTHROPIC_API_KEY unset)
  const aiScored = await Promise.all(
    topCandidates.map(async (c) => ({
      candidate: c,
      score: await scoreWithAI(c, fruitNameEn, latinName),
    })),
  );

  const best = aiScored.sort((a, b) => b.score - a.score)[0]!;
  const { candidate, score } = best;

  const usingAI = !!env.ANTHROPIC_API_KEY;
  console.log(
    `[imageService] ${fruitId} — best: ${candidate.source} ` +
    `(${usingAI ? 'AI' : 'keyword'} score=${score.toFixed(2)})`,
  );

  // Mark as processing before download
  const record = await prisma.fruitImage.upsert({
    where: {
      fruitId_source_sourceId: { fruitId, source: candidate.source, sourceId: candidate.sourceId },
    },
    update: { status: 'processing' },
    create: {
      fruitId,
      source:       candidate.source,
      sourceId:     candidate.sourceId,
      sourceUrl:    candidate.pageUrl,
      authorName:   candidate.authorName,
      authorUrl:    candidate.authorUrl,
      license:      candidate.license,
      status:       'processing',
      isPrimary:    false,
      qualityScore: score,
    },
  });

  try {
    const imgRes = await fetch(candidate.downloadUrl, { signal: AbortSignal.timeout(30_000) });
    if (!imgRes.ok) throw new Error(`Download failed: ${imgRes.status}`);
    const imgBuffer = Buffer.from(await imgRes.arrayBuffer());

    const { heroCdnUrl, thumbCdnUrl, heroKey, thumbKey } = await processAndUploadImage(
      imgBuffer,
      fruitId,
    );

    await prisma.fruitImage.updateMany({
      where: { fruitId, isPrimary: true },
      data:  { isPrimary: false },
    });

    await prisma.fruitImage.update({
      where: { id: record.id },
      data:  {
        s3KeyHero:    heroKey,
        s3KeyThumb:   thumbKey,
        cdnUrlHero:   heroCdnUrl,
        cdnUrlThumb:  thumbCdnUrl,
        status:       'ready',
        isPrimary:    true,
        qualityScore: score,
      },
    });

    console.log(`[imageService] ✓ ${fruitId} → ${candidate.source} (score=${score.toFixed(2)})`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await prisma.fruitImage.update({
      where: { id: record.id },
      data:  { status: 'failed', errorMessage: msg },
    });
    console.error(`[imageService] ✗ ${fruitId}: ${msg}`);
  }
}
