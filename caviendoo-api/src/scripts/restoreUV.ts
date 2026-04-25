/**
 * One-off: restore correct uvPeak values captured from the OpenUV sync run today.
 * Values are from today's actual OpenUV API responses — not seeded defaults.
 * Run: npx tsx src/scripts/restoreUV.ts
 */

import '../config/env';
import { prisma } from '../config/db';

const UV_VALUES: Record<string, number> = {
  'Tunis':      9.0928,
  'Ben Arous':  9.0928,
  'Manouba':    9.0928,
  'Ariana':     9.0928,
  'Sousse':     9.1225,
  'Monastir':   9.1225,
  'Zaghouan':   9.1619,
  'Nabeul':     9.1619,
  'Mahdia':     9.1619,
  'Jendouba':   9.2311,
  'Béja':       9.2311,
  'El Kef':     9.2705,
  'Kairouan':   9.4088,
  'Siliana':    9.4483,
  'Sidi Bouzid':9.4779,
  'Sfax':       9.547,
  'Kasserine':  9.6753,
  'Gabès':      9.7148,
  'Gafsa':      9.932,
  'Kébili':     9.9814,
  'Médenine':   10.0604,
  'Tozeur':     10.0604,
  'Tataouine':  10.4059,
  'Bizerte':    8.8065,
};

async function main() {
  console.log('[restoreUV] Writing today\'s OpenUV values directly to DB…\n');
  let ok = 0;

  for (const [shapeName, uvPeak] of Object.entries(UV_VALUES)) {
    const result = await prisma.governorate.updateMany({
      where: { shapeName },
      data:  { uvPeak },
    });
    if (result.count > 0) {
      console.log(`  ✓ ${shapeName.padEnd(14)} uvPeak=${uvPeak}`);
      ok++;
    } else {
      console.warn(`  ? ${shapeName} — not found in DB`);
    }
  }

  console.log(`\n[restoreUV] Done — ${ok}/${Object.keys(UV_VALUES).length} restored`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  prisma.$disconnect();
  process.exit(1);
});
