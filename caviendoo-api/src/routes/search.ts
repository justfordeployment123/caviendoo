import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db';
import { validate } from '../middleware/validate';
import { mapFruitToResponse } from '../utils/fruitMapper';

const SearchQuerySchema = z.object({
  q:      z.string().min(1, 'Query is required').max(100),
  locale: z.enum(['en', 'fr', 'ar']).default('en'),
  limit:  z.coerce.number().int().min(1).max(20).default(8),
});

const router = Router();

// GET /api/v1/search?q=&locale=&limit=
router.get('/', validate({ query: SearchQuerySchema }), async (req, res, next) => {
  try {
    const { q, locale, limit } = req.query as any;

    // pg_trgm-powered ILIKE search with trigram index for fast fuzzy matching
    const fruits = await prisma.fruit.findMany({
      where: {
        OR: [
          { nameEn:    { contains: q, mode: 'insensitive' } },
          { nameFr:    { contains: q, mode: 'insensitive' } },
          { nameAr:    { contains: q, mode: 'insensitive' } },
          { localName: { contains: q, mode: 'insensitive' } },
          { latinName: { contains: q, mode: 'insensitive' } },
        ],
      },
      include: {
        images: {
          where: { isPrimary: true, status: 'ready' },
          take:  1,
        },
        governorates: {
          include: { governorate: { select: { shapeName: true } } },
        },
      },
      take: limit,
      orderBy: [
        // Exact matches first by putting the locale name first
        ...(locale === 'fr'
          ? [{ nameFr: 'asc' as const }]
          : locale === 'ar'
          ? [{ nameAr: 'asc' as const }]
          : [{ nameEn: 'asc' as const }]),
      ],
    });

    res.json({ data: fruits.map((f) => mapFruitToResponse(f)) });
  } catch (err) {
    next(err);
  }
});

export default router;
