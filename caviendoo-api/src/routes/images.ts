import { Router } from 'express';
import { z } from 'zod';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3 } from '../config/s3';
import { env } from '../config/env';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { imagePipelineLimiter } from '../middleware/rateLimiter';
import { HttpError } from '../utils/httpError';
import { prisma } from '../config/db';

const PresignBodySchema = z.object({
  fruitId:   z.string().min(1).max(80),
  imageType: z.enum(['hero', 'thumbnail']),
  mimeType:  z.enum(['image/webp', 'image/jpeg', 'image/png']),
});

const router = Router();

// POST /api/v1/images/presign  — returns a pre-signed S3 PUT URL (admin only)
router.post(
  '/presign',
  requireAuth,
  imagePipelineLimiter,
  validate({ body: PresignBodySchema }),
  async (req, res, next) => {
    try {
      const { fruitId, imageType, mimeType } = req.body as z.infer<typeof PresignBodySchema>;

      // Verify the fruit exists
      const exists = await prisma.fruit.findUnique({ where: { id: fruitId }, select: { id: true } });
      if (!exists) return next(new HttpError(404, `Fruit '${fruitId}' not found`));

      const ext = mimeType === 'image/webp' ? 'webp' : mimeType === 'image/jpeg' ? 'jpg' : 'png';
      const key = `public/fruits/${fruitId}/${imageType}.${ext}`;

      const command = new PutObjectCommand({
        Bucket:      env.S3_BUCKET,
        Key:         key,
        ContentType: mimeType,
      });

      const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
      const cdnUrl    = `${env.CDN_BASE_URL}/${key}`;

      res.json({ uploadUrl, cdnUrl, key });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
