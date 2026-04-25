/**
 * One-shot manual trigger for background sync jobs.
 * Run with: npx tsx src/scripts/triggerSync.ts [--uv] [--climate]
 * Defaults to running both if no flag is given.
 */

import '../config/env';
import { prisma } from '../config/db';
import { fetchUvForecast } from '../services/openuvService';
import { getClimateClimatology } from '../services/nasaPowerService';
import { getSoilData } from '../services/isricService';
import { env } from '../config/env';

const args = process.argv.slice(2);
const runUV      = args.length === 0 || args.includes('--uv');
const runClimate = args.length === 0 || args.includes('--climate');

async function syncUV(govs: { id: number; shapeName: string; centroidLat: number; centroidLng: number }[]) {
  console.log(`\n[UV] Starting UV sync for ${govs.length} governorates…`);
  let ok = 0; let fail = 0;

  for (const g of govs) {
    try {
      const forecast = await fetchUvForecast(g.centroidLat, g.centroidLng);
      const isAlert  = forecast.uv_max >= env.UV_ALERT_THRESHOLD;
      const today    = new Date(); today.setUTCHours(0, 0, 0, 0);

      await prisma.$transaction([
        prisma.uvForecast.upsert({
          where:  { governorateId_forecastDate: { governorateId: g.id, forecastDate: today } },
          update: { uvMax: forecast.uv_max, uvAlert: isAlert, rawPayload: forecast as object },
          create: { governorateId: g.id, forecastDate: today, uvMax: forecast.uv_max, uvAlert: isAlert, rawPayload: forecast as object },
        }),
        prisma.governorate.update({
          where: { id: g.id },
          data:  { uvPeak: forecast.uv_max },
        }),
      ]);

      console.log(`  ✓ ${g.shapeName.padEnd(14)} UV max=${forecast.uv_max}${isAlert ? ' ⚠ ALERT' : ''}`);
      ok++;
    } catch (err: any) {
      console.error(`  ✗ ${g.shapeName}: ${err.message}`);
      fail++;
    }
  }

  console.log(`[UV] Done — ${ok} ok, ${fail} failed`);
}

async function syncClimate(govs: { id: number; shapeName: string; centroidLat: number; centroidLng: number }[]) {
  console.log(`\n[Climate] Starting climate+soil sync for ${govs.length} governorates…`);
  let ok = 0; let fail = 0;

  for (const g of govs) {
    try {
      const [climate, soil] = await Promise.all([
        getClimateClimatology(g.centroidLat, g.centroidLng),
        getSoilData(g.centroidLat, g.centroidLng),
      ]);

      await prisma.governorate.update({
        where: { id: g.id },
        data: {
          aquiferStressPct:     Math.round(climate.aquiferStressPct),
          // uvPeak is owned by OpenUV nightly job — NASA POWER UV is a daily average, not peak
          soilPhTypical:        soil.soilPhTypical,
          soilTexture:          soil.soilTexture,
          soilOrganicCarbonPct: soil.soilOrganicCarbonPct,
        },
      });

      console.log(
        `  ✓ ${g.shapeName.padEnd(14)} stress=${climate.aquiferStressPct}%` +
        `  pH=${soil.soilPhTypical ?? '?'}  texture=${soil.soilTexture ?? '?'}`,
      );
      ok++;
    } catch (err: any) {
      const cause = err.cause?.message ?? err.cause ?? '';
      console.error(`  ✗ ${g.shapeName}: ${err.message}${cause ? ` → ${cause}` : ''}`);
      fail++;
    }
  }

  console.log(`[Climate] Done — ${ok} ok, ${fail} failed`);
}

async function main() {
  console.log('[sync] Fetching governorates with coordinates…');

  const govs = await prisma.governorate.findMany({
    where:  { centroidLat: { not: null }, centroidLng: { not: null } },
    select: { id: true, shapeName: true, centroidLat: true, centroidLng: true },
  }) as { id: number; shapeName: string; centroidLat: number; centroidLng: number }[];

  if (!govs.length) {
    console.error('[sync] No governorates with coordinates found. Run the seed first.');
    process.exit(1);
  }

  console.log(`[sync] Found ${govs.length} governorates`);

  if (runUV)      await syncUV(govs);
  if (runClimate) await syncClimate(govs);

  await prisma.$disconnect();
  console.log('\n[sync] All done.');
}

main().catch((err) => {
  console.error('[sync] Fatal:', err);
  prisma.$disconnect();
  process.exit(1);
});
