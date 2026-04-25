/**
 * Live external data routes — nutrition, biodiversity, production.
 * All results are Redis-cached. No auth required (public read).
 */

import { Router } from 'express';
import { prisma } from '../config/db';
import { getNutritionByName } from '../services/usdaFoodService';
import { getBiodiversityData } from '../services/gbifService';
import { getProductionData, getCropKc, DEFAULT_YIELD_KG_HA } from '../services/faostatService';
import { getClimateClimatology, calcWaterFootprint } from '../services/nasaPowerService';
import { cacheGetOrFetch, TTL } from '../services/cacheService';
import { HttpError } from '../utils/httpError';

const router = Router();

// ── GET /api/v1/live/fruits/:id/nutrition ────────────────────────────────────
// Fetch nutritional data from USDA FoodData Central (cached 7 days)
router.get('/fruits/:id/nutrition', async (req, res, next) => {
  try {
    const fruit = await prisma.fruit.findUnique({
      where:  { id: req.params['id'] },
      select: { nameEn: true },
    });
    if (!fruit) return next(new HttpError(404, 'Fruit not found'));

    const fields = await cacheGetOrFetch(
      `live:nutrition:${req.params['id']}`,
      () => getNutritionByName(fruit.nameEn),
      TTL.NUTRITION,
    );

    res.json({ source: 'usda', fields: fields ?? [] });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/v1/live/fruits/:id/biodiversity ─────────────────────────────────
// Fetch GBIF occurrence data for the fruit's Latin name (cached 7 days)
router.get('/fruits/:id/biodiversity', async (req, res, next) => {
  try {
    const fruit = await prisma.fruit.findUnique({
      where:  { id: req.params['id'] },
      select: { latinName: true },
    });
    if (!fruit) return next(new HttpError(404, 'Fruit not found'));

    const data = await cacheGetOrFetch(
      `live:biodiversity:${req.params['id']}`,
      () => getBiodiversityData(fruit.latinName),
      TTL.BIODIVERSITY,
    );

    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/v1/live/fruits/:id/production ───────────────────────────────────
// Fetch FAOSTAT Tunisia production data (cached 30 days)
router.get('/fruits/:id/production', async (req, res, next) => {
  try {
    const fruit = await prisma.fruit.findUnique({
      where:  { id: req.params['id'] },
      select: { latinName: true, nameEn: true },
    });
    if (!fruit) return next(new HttpError(404, 'Fruit not found'));

    const data = await cacheGetOrFetch(
      `live:production:${req.params['id']}`,
      () => getProductionData(fruit.latinName, fruit.nameEn),
      TTL.PRODUCTION,
    );

    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ── GET /api/v1/live/fruits/:id/environmental ────────────────────────────────
// Compute NASA POWER-based water footprint + real UV for the fruit's primary governorate
router.get('/fruits/:id/environmental', async (req, res, next) => {
  try {
    const fruit = await prisma.fruit.findUnique({
      where:  { id: req.params['id'] },
      select: { latinName: true, category: true, primaryGovernorate: true },
    });
    if (!fruit) return next(new HttpError(404, 'Fruit not found'));

    const gov = await prisma.governorate.findUnique({
      where:  { shapeName: fruit.primaryGovernorate },
      select: { centroidLat: true, centroidLng: true, aquiferStressPct: true, uvPeak: true },
    });
    if (!gov?.centroidLat) return next(new HttpError(422, 'No coordinates for primary governorate'));

    const data = await cacheGetOrFetch(
      `live:environmental:${req.params['id']}`,
      async () => {
        const [climate, production] = await Promise.all([
          getClimateClimatology(gov.centroidLat!, gov.centroidLng!),
          getProductionData(fruit.latinName, undefined),
        ]);

        const Kc       = getCropKc(fruit.category, fruit.latinName);
        const yieldKgHa = production.yieldKgHa ?? DEFAULT_YIELD_KG_HA[fruit.category] ?? 8000;
        const wf       = calcWaterFootprint(climate, Kc, yieldKgHa);

        return {
          ...wf,
          aquiferStressPct: climate.aquiferStressPct,
          uvIndexPeak:      climate.uvIndexPeak,
          uvIndexAnnual:    climate.uvIndexAnnual,
          precipMmYear:     climate.precipMmYear,
          tempCMean:        climate.tempCMean,
          aridityIndex:     climate.aridityIndex,
          Kc,
          yieldKgHa,
          dataSource:       'nasa_power_faostat',
        };
      },
      TTL.CLIMATE,
    );

    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
