/**
 * Caviendoo seed — imports data from the frontend package and writes it to the DB.
 * Run with: tsx --tsconfig prisma/seed/tsconfig.json prisma/seed/index.ts
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Import data directly from the frontend package using relative paths.
// The @/types imports in those files are `import type` (erased at runtime) so
// they require no resolution here — only the runtime value exports matter.
import { fruits } from './data/fruits';
import { governorates } from './data/governorates';

const prisma = new PrismaClient({
  log: [{ emit: 'stdout', level: 'info' }],
});

// ── Governorate centroids (approximate, for UV forecast API calls) ──────────

const CENTROIDS: Record<string, { lat: number; lng: number }> = {
  Tunis:       { lat: 36.8190, lng: 10.1658 },
  Ariana:      { lat: 36.8625, lng: 10.1956 },
  'Ben Arous': { lat: 36.7535, lng: 10.2282 },
  Manouba:     { lat: 36.8100, lng: 9.9833  },
  Nabeul:      { lat: 36.4515, lng: 10.7357 },
  Zaghouan:    { lat: 36.4027, lng: 10.1429 },
  Bizerte:     { lat: 37.2744, lng: 9.8739  },
  Béja:        { lat: 36.7254, lng: 9.1817  },
  Jendouba:    { lat: 36.5011, lng: 8.7802  },
  'El Kef':    { lat: 36.1675, lng: 8.7047  },
  Siliana:     { lat: 36.0851, lng: 9.3708  },
  Kairouan:    { lat: 35.6781, lng: 10.0963 },
  Kasserine:   { lat: 35.1675, lng: 8.8314  },
  'Sidi Bouzid': { lat: 35.0382, lng: 9.4849 },
  Sousse:      { lat: 35.8245, lng: 10.6346 },
  Monastir:    { lat: 35.7783, lng: 10.8310 },
  Mahdia:      { lat: 35.5047, lng: 11.0622 },
  Sfax:        { lat: 34.7400, lng: 10.7600 },
  Gafsa:       { lat: 34.4250, lng: 8.7842  },
  Tozeur:      { lat: 33.9197, lng: 8.1338  },
  Kébili:      { lat: 33.7034, lng: 8.9693  },
  Gabès:       { lat: 33.8831, lng: 10.0982 },
  Médenine:    { lat: 33.3549, lng: 10.5055 },
  Tataouine:   { lat: 32.9211, lng: 10.4510 },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function frenchDesc(g: any): string {
  return g.description ?? '';
}

// ── Seed governorates ─────────────────────────────────────────────────────────

async function seedGovernorates(): Promise<void> {
  console.log(`Seeding ${governorates.length} governorates…`);

  for (const g of governorates) {
    const centroid = CENTROIDS[g.shapeName];
    await prisma.governorate.upsert({
      where:  { shapeName: g.shapeName },
      update: {
        shapeISO:         g.shapeISO,
        countryCode:      'TN',
        aquiferStressPct: g.aquiferStressPct,
        waterLabel:       g.waterLabel,
        uvPeak:           g.uvPeak,
        uvLabel:          g.uvLabel,
        descriptionEn:    g.description ?? null,
        descriptionFr:    frenchDesc(g) || null,
        descriptionAr:    null,
        centroidLat:      centroid?.lat ?? null,
        centroidLng:      centroid?.lng ?? null,
      },
      create: {
        shapeName:        g.shapeName,
        shapeISO:         g.shapeISO,
        countryCode:      'TN',
        aquiferStressPct: g.aquiferStressPct,
        waterLabel:       g.waterLabel,
        uvPeak:           g.uvPeak,
        uvLabel:          g.uvLabel,
        descriptionEn:    g.description ?? null,
        descriptionFr:    null,
        descriptionAr:    null,
        centroidLat:      centroid?.lat ?? null,
        centroidLng:      centroid?.lng ?? null,
      },
    });
  }

  console.log(`✓ ${governorates.length} governorates seeded`);
}

// ── Seed fruits ───────────────────────────────────────────────────────────────

async function seedFruits(): Promise<void> {
  console.log(`Seeding ${fruits.length} fruits…`);

  for (const f of fruits) {
    // Upsert core fruit record
    await prisma.fruit.upsert({
      where:  { id: f.id },
      update: {
        nameEn:             f.name.en,
        nameFr:             f.name.fr,
        nameAr:             f.name.ar,
        localName:          f.localName,
        latinName:          f.latinName,
        category:           f.category,
        isAOC:              f.isAOC,
        isHeritage:         f.isHeritage,
        primaryGovernorate: f.primaryGovernorate,
        seasonPre:          f.season.pre,
        seasonPeak:         f.season.peak,
        seasonPost:         f.season.post,
        descriptionEn:      f.description.en,
        descriptionFr:      f.description.fr,
        descriptionAr:      f.description.ar,
        culturalNotesEn:    f.culturalNotes.en,
        culturalNotesFr:    f.culturalNotes.fr,
        culturalNotesAr:    f.culturalNotes.ar,
        zoneEn:             f.zone.en,
        zoneFr:             f.zone.fr,
        zoneAr:             f.zone.ar,
        localities:         f.localities,
        tags:               f.tags,
      },
      create: {
        id:                 f.id,
        nameEn:             f.name.en,
        nameFr:             f.name.fr,
        nameAr:             f.name.ar,
        localName:          f.localName,
        latinName:          f.latinName,
        category:           f.category,
        isAOC:              f.isAOC,
        isHeritage:         f.isHeritage,
        primaryGovernorate: f.primaryGovernorate,
        seasonPre:          f.season.pre,
        seasonPeak:         f.season.peak,
        seasonPost:         f.season.post,
        descriptionEn:      f.description.en,
        descriptionFr:      f.description.fr,
        descriptionAr:      f.description.ar,
        culturalNotesEn:    f.culturalNotes.en,
        culturalNotesFr:    f.culturalNotes.fr,
        culturalNotesAr:    f.culturalNotes.ar,
        zoneEn:             f.zone.en,
        zoneFr:             f.zone.fr,
        zoneAr:             f.zone.ar,
        localities:         f.localities,
        tags:               f.tags,
      },
    });

    // Upsert environmental data (scoped to primary governorate region)
    if (f.environmental) {
      const primaryGov = await prisma.governorate.findUnique({
        where:  { shapeName: f.primaryGovernorate },
        select: { id: true },
      });
      if (!primaryGov) {
        console.warn(`  ⚠ Primary governorate not found for env data: "${f.primaryGovernorate}" (fruit: ${f.id})`);
      } else {
        await prisma.fruitEnvironmental.upsert({
          where:  { fruitId_regionId: { fruitId: f.id, regionId: primaryGov.id } },
          update: {
            blueWaterLkg:        f.environmental.blueWaterLkg,
            greenWaterLkg:       f.environmental.greenWaterLkg,
            totalWaterLkg:       f.environmental.totalWaterLkg,
            aquiferStressPct:    f.environmental.aquiferStressPct,
            uvMin:               f.environmental.uvMin,
            uvMax:               f.environmental.uvMax,
            uvPeak:              f.environmental.uvPeak,
            uvNote:              f.environmental.uvNote,
            sustainabilityClass: f.environmental.sustainabilityClass,
          },
          create: {
            fruitId:             f.id,
            regionId:            primaryGov.id,
            blueWaterLkg:        f.environmental.blueWaterLkg,
            greenWaterLkg:       f.environmental.greenWaterLkg,
            totalWaterLkg:       f.environmental.totalWaterLkg,
            aquiferStressPct:    f.environmental.aquiferStressPct,
            uvMin:               f.environmental.uvMin,
            uvMax:               f.environmental.uvMax,
            uvPeak:              f.environmental.uvPeak,
            uvNote:              f.environmental.uvNote,
            sustainabilityClass: f.environmental.sustainabilityClass,
          },
        });
      }
    }

    // Replace nutritional fields
    if (f.nutritional.length > 0) {
      await prisma.nutritionalField.deleteMany({ where: { fruitId: f.id } });
      await prisma.nutritionalField.createMany({
        data: f.nutritional.map((n: any, i: number) => ({
          fruitId:  f.id,
          labelEn:  n.label.en,
          labelFr:  n.label.fr,
          labelAr:  n.label.ar,
          value:    n.value,
          sortOrder: i,
        })),
      });
    }

    // Link governorates
    for (const govName of f.governorates) {
      const gov = await prisma.governorate.findUnique({
        where:  { shapeName: govName },
        select: { id: true },
      });
      if (!gov) {
        console.warn(`  ⚠ Governorate not found: "${govName}" (fruit: ${f.id})`);
        continue;
      }
      await prisma.fruitGovernorate.upsert({
        where:  { fruitId_governorateId: { fruitId: f.id, governorateId: gov.id } },
        update: { isPrimary: govName === f.primaryGovernorate },
        create: { fruitId: f.id, governorateId: gov.id, isPrimary: govName === f.primaryGovernorate },
      });
    }
  }

  console.log(`✓ ${fruits.length} fruits seeded`);
}

// ── Seed admin user ───────────────────────────────────────────────────────────

async function seedAdminUser(): Promise<void> {
  const email    = process.env['ADMIN_INITIAL_EMAIL'];
  const password = process.env['ADMIN_INITIAL_PASSWORD'];

  if (!email || !password) {
    console.log('No ADMIN_INITIAL_EMAIL/PASSWORD set — skipping admin user creation');
    return;
  }

  const hash = await bcrypt.hash(password, 12);
  await prisma.adminUser.upsert({
    where:  { email },
    update: { passwordHash: hash },
    create: { email, passwordHash: hash, name: 'Admin' },
  });

  console.log(`✓ Admin user created: ${email}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('─── Caviendoo Seed Starting ───────────────────────────────');

  await seedGovernorates();
  await seedFruits();
  await seedAdminUser();

  console.log('─── Seed Complete ─────────────────────────────────────────');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
