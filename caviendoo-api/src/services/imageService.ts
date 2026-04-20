import { fetch } from 'undici';
import { prisma } from '../config/db';
import { processAndUploadImage } from './imageProcessor';
import { env } from '../config/env';

type ImageSource = 'pixabay' | 'unsplash' | 'pexels';

interface ImageCandidate {
  sourceId:    string;
  source:      ImageSource;
  downloadUrl: string;
  pageUrl:     string;
  authorName:  string;
  authorUrl:   string;
  license:     string;
  width:       number;
  height:      number;
  score:       number;
}

// ── Relevance scoring ─────────────────────────────────────────────────────────

function scoreCandidate(query: string, tagString: string): number {
  const queryWords = query.toLowerCase().split(/\s+/);
  const tags       = tagString.toLowerCase();
  const matched    = queryWords.filter((w) => tags.includes(w)).length;
  return Math.min(1, 0.3 + (matched / queryWords.length) * 0.7);
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

  const res  = await fetch(url.toString(), { signal: AbortSignal.timeout(8_000) });
  if (!res.ok) return [];

  const data = (await res.json()) as { hits?: any[] };
  return (data.hits ?? []).map((hit: any): ImageCandidate => ({
    sourceId:    String(hit.id),
    source:      'pixabay',
    downloadUrl: hit.largeImageURL as string,
    pageUrl:     hit.pageURL as string,
    authorName:  hit.user as string,
    authorUrl:   `https://pixabay.com/users/${hit.user}-${hit.user_id}/`,
    license:     'Pixabay License',
    width:       hit.imageWidth as number,
    height:      hit.imageHeight as number,
    score:       scoreCandidate(query, hit.tags ?? ''),
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
    sourceId:    photo.id as string,
    source:      'unsplash',
    downloadUrl: (photo.urls?.regular ?? photo.urls?.full) as string,
    pageUrl:     `${photo.links?.html}?utm_source=caviendoo&utm_medium=referral`,
    authorName:  photo.user?.name as string,
    authorUrl:   `${photo.user?.links?.html}?utm_source=caviendoo&utm_medium=referral`,
    license:     'Unsplash License',
    width:       photo.width as number,
    height:      photo.height as number,
    score:       scoreCandidate(query, (photo.tags ?? []).map((t: any) => t.title ?? '').join(' ')),
  }));
}

// ── Pexels ────────────────────────────────────────────────────────────────────

async function searchPexels(query: string): Promise<ImageCandidate[]> {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`;

  const res = await fetch(url, {
    headers: { Authorization: env.PEXELS_API_KEY },
    signal:  AbortSignal.timeout(8_000),
  });
  if (!res.ok) return [];

  const data = (await res.json()) as { photos?: any[] };
  return (data.photos ?? []).map((photo: any): ImageCandidate => ({
    sourceId:    String(photo.id),
    source:      'pexels',
    downloadUrl: (photo.src?.large2x ?? photo.src?.large) as string,
    pageUrl:     photo.url as string,
    authorName:  photo.photographer as string,
    authorUrl:   photo.photographer_url as string,
    license:     'Pexels License',
    width:       photo.width as number,
    height:      photo.height as number,
    score:       0.5, // Pexels has no tag metadata; use base score
  }));
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

  let candidates: ImageCandidate[] = [];

  for (const q of queries) {
    const [pix, unsp, pex] = await Promise.allSettled([
      searchPixabay(q),
      searchUnsplash(q),
      searchPexels(q),
    ]);

    candidates.push(
      ...(pix.status  === 'fulfilled' ? pix.value  : []),
      ...(unsp.status === 'fulfilled' ? unsp.value : []),
      ...(pex.status  === 'fulfilled' ? pex.value  : []),
    );

    // Stop searching once we have enough good candidates
    if (candidates.filter((c) => c.width >= 800).length >= 5) break;

    // Courtesy delay between query rounds
    await new Promise((r) => setTimeout(r, 300));
  }

  // Best candidate: minimum 800px width, highest relevance score
  const best = candidates
    .filter((c) => c.width >= 800)
    .sort((a, b) => b.score - a.score)[0];

  if (!best) {
    console.warn(`[imageService] No suitable image found for ${fruitId}`);
    await prisma.fruitImage.create({
      data: {
        fruitId,
        source:       'pixabay',
        sourceId:     'none',
        sourceUrl:    '',
        license:      '',
        status:       'failed',
        isPrimary:    false,
        errorMessage: 'No suitable image found from any provider',
      },
    });
    return;
  }

  // Mark status as processing before download
  const record = await prisma.fruitImage.upsert({
    where: {
      fruitId_source_sourceId: { fruitId, source: best.source, sourceId: best.sourceId },
    },
    update: { status: 'processing' },
    create: {
      fruitId,
      source:      best.source,
      sourceId:    best.sourceId,
      sourceUrl:   best.pageUrl,
      authorName:  best.authorName,
      authorUrl:   best.authorUrl,
      license:     best.license,
      status:      'processing',
      isPrimary:   false,
      qualityScore: best.score,
    },
  });

  try {
    // Download source image
    const imgRes = await fetch(best.downloadUrl, { signal: AbortSignal.timeout(30_000) });
    if (!imgRes.ok) throw new Error(`Download failed: ${imgRes.status}`);
    const imgBuffer = Buffer.from(await imgRes.arrayBuffer());

    // Process (resize/convert) and upload to S3
    const { heroCdnUrl, thumbCdnUrl, heroKey, thumbKey } = await processAndUploadImage(
      imgBuffer,
      fruitId,
    );

    // Unset previous primary, then mark this one as primary
    await prisma.fruitImage.updateMany({
      where: { fruitId, isPrimary: true },
      data:  { isPrimary: false },
    });

    await prisma.fruitImage.update({
      where: { id: record.id },
      data:  {
        s3KeyHero:   heroKey,
        s3KeyThumb:  thumbKey,
        cdnUrlHero:  heroCdnUrl,
        cdnUrlThumb: thumbCdnUrl,
        status:      'ready',
        isPrimary:   true,
        qualityScore: best.score,
      },
    });

    console.log(`[imageService] ✓ ${fruitId} → ${best.source} (score=${best.score.toFixed(2)})`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await prisma.fruitImage.update({
      where: { id: record.id },
      data:  { status: 'failed', errorMessage: msg },
    });
    console.error(`[imageService] ✗ ${fruitId}: ${msg}`);
  }
}
