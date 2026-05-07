import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db';
import { validate } from '../middleware/validate';
import { HttpError } from '../utils/httpError';

const QuerySchema = z.object({
  fruit_id:  z.string().min(1).max(80),
  region_id: z.coerce.number().int().positive(),
});

const router = Router();

// GET /api/v1/comparable-regions?fruit_id=&region_id=
// AI-ready stub — returns structured JSON matching the future AI engine schema.
// Uses environmental similarity scoring until the AI layer is connected.
// _stub: true and aiInsight: null mark fields reserved for future AI output.
router.get('/', validate({ query: QuerySchema }), async (req, res, next) => {
  try {
    const { fruit_id, region_id } = req.query as { fruit_id: string; region_id: string };
    const regionId = Number(region_id);

    const [fruit, sourceRegion] = await Promise.all([
      prisma.fruit.findUnique({
        where:  { id: fruit_id },
        select: { id: true, nameEn: true, latinName: true, category: true },
      }),
      prisma.governorate.findUnique({
        where:  { id: regionId },
        select: {
          id: true, shapeName: true, shapeISO: true,
          uvPeak: true, aquiferStressPct: true, waterLabel: true, uvLabel: true,
        },
      }),
    ]);

    if (!fruit)        return next(new HttpError(404, `Fruit '${fruit_id}' not found`));
    if (!sourceRegion) return next(new HttpError(404, `Region '${region_id}' not found`));

    const allRegions = await prisma.governorate.findMany({
      where:  { countryCode: 'TN', id: { not: regionId } },
      select: {
        id: true, shapeName: true, shapeISO: true,
        uvPeak: true, aquiferStressPct: true, waterLabel: true, uvLabel: true,
      },
    });

    // Similarity: 50% UV proximity + 50% aquifer stress proximity
    const scored = allRegions.map((r) => {
      const uvSim      = 1 - Math.abs(sourceRegion.uvPeak - r.uvPeak) / 11;
      const aquiferSim = 1 - Math.abs(sourceRegion.aquiferStressPct - r.aquiferStressPct) / 100;
      const score      = Math.round((0.5 * uvSim + 0.5 * aquiferSim) * 100) / 100;

      const matchFactors: string[] = [];
      if (Math.abs(sourceRegion.uvPeak - r.uvPeak) <= 1)                       matchFactors.push('similar_uv');
      if (Math.abs(sourceRegion.aquiferStressPct - r.aquiferStressPct) <= 15)  matchFactors.push('similar_water_stress');
      if (sourceRegion.uvPeak >= 8 && r.uvPeak >= 8)                           matchFactors.push('same_climate_zone');

      const recommendation =
        score >= 0.8 ? 'High similarity — viable alternative growing region' :
        score >= 0.6 ? 'Moderate similarity — suitable with minor adaptation' :
                       'Low similarity — significant adaptation required';

      return {
        shapeName:       r.shapeName,
        shapeISO:        r.shapeISO,
        country:         'TN',
        similarityScore: score,
        matchFactors,
        climate: {
          uvPeak:           r.uvPeak,
          uvLabel:          r.uvLabel,
          aquiferStressPct: r.aquiferStressPct,
          waterLabel:       r.waterLabel,
        },
        recommendation,
      };
    });

    scored.sort((a, b) => b.similarityScore - a.similarityScore);

    res.json({
      fruit: {
        id:        fruit.id,
        name:      fruit.nameEn,
        latinName: fruit.latinName,
        category:  fruit.category,
      },
      sourceRegion: {
        shapeName: sourceRegion.shapeName,
        shapeISO:  sourceRegion.shapeISO,
        country:   'TN',
        climate: {
          uvPeak:           sourceRegion.uvPeak,
          uvLabel:          sourceRegion.uvLabel,
          aquiferStressPct: sourceRegion.aquiferStressPct,
          waterLabel:       sourceRegion.waterLabel,
        },
      },
      comparableRegions: scored.slice(0, 5),
      aiInsight:         null,  // reserved for future AI-generated narrative
      _stub:             true,
      _schemaVersion:    '1.0',
    });
  } catch (err) {
    next(err);
  }
});

export default router;
