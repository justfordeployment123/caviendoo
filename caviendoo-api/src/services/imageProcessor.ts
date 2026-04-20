import sharp from 'sharp';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3 } from '../config/s3';
import { env } from '../config/env';

const HERO_WIDTH  = 800;
const HERO_HEIGHT = 500;
const THUMB_SIZE  = 168;
const WEBP_HERO_QUALITY  = 85;
const WEBP_THUMB_QUALITY = 80;

export interface ProcessUploadResult {
  heroKey:     string;
  thumbKey:    string;
  heroCdnUrl:  string;
  thumbCdnUrl: string;
}

export async function processAndUploadImage(
  sourceBuffer: Buffer,
  fruitId: string,
): Promise<ProcessUploadResult> {
  // Process both sizes in parallel
  const [heroBuffer, thumbBuffer] = await Promise.all([
    sharp(sourceBuffer)
      .resize({ width: HERO_WIDTH, height: HERO_HEIGHT, fit: 'cover', position: 'centre' })
      .webp({ quality: WEBP_HERO_QUALITY })
      .toBuffer(),
    sharp(sourceBuffer)
      .resize({ width: THUMB_SIZE, height: THUMB_SIZE, fit: 'cover', position: 'centre' })
      .webp({ quality: WEBP_THUMB_QUALITY })
      .toBuffer(),
  ]);

  const heroKey  = `public/fruits/${fruitId}/hero.webp`;
  const thumbKey = `public/fruits/${fruitId}/thumbnail.webp`;

  // Upload both to S3 in parallel with immutable cache headers
  await Promise.all([
    s3.send(
      new PutObjectCommand({
        Bucket:       env.S3_BUCKET,
        Key:          heroKey,
        Body:         heroBuffer,
        ContentType:  'image/webp',
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    ),
    s3.send(
      new PutObjectCommand({
        Bucket:       env.S3_BUCKET,
        Key:          thumbKey,
        Body:         thumbBuffer,
        ContentType:  'image/webp',
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    ),
  ]);

  return {
    heroKey,
    thumbKey,
    heroCdnUrl:  `${env.CDN_BASE_URL}/${heroKey}`,
    thumbCdnUrl: `${env.CDN_BASE_URL}/${thumbKey}`,
  };
}
