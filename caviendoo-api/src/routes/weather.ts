import { Router } from 'express';
import { prisma } from '../config/db';
import { getCurrentWeather } from '../services/openMeteoService';
import { getClimateClimatology } from '../services/nasaPowerService';
import { cacheGetOrFetch, TTL } from '../services/cacheService';
import { HttpError } from '../utils/httpError';

const router = Router();

// GET /api/v1/weather/governorate/:shapeName
// Returns live weather + 30-yr climate normals for a governorate
router.get('/governorate/:shapeName', async (req, res, next) => {
  try {
    const { shapeName } = req.params as { shapeName: string };

    const gov = await prisma.governorate.findUnique({
      where:  { shapeName },
      select: { centroidLat: true, centroidLng: true, shapeName: true, uvPeak: true },
    });
    if (!gov) return next(new HttpError(404, 'Governorate not found'));
    if (!gov.centroidLat || !gov.centroidLng) {
      return next(new HttpError(422, 'Governorate has no coordinates'));
    }

    const lat = gov.centroidLat;
    const lng = gov.centroidLng;

    const [weather, climate] = await Promise.all([
      cacheGetOrFetch(
        `weather:current:${shapeName}`,
        () => getCurrentWeather(lat, lng),
        TTL.WEATHER,
      ),
      cacheGetOrFetch(
        `weather:climate:${shapeName}`,
        () => getClimateClimatology(lat, lng),
        TTL.CLIMATE,
      ),
    ]);

    res.json({ weather, climate });
  } catch (err) {
    next(err);
  }
});

export default router;
