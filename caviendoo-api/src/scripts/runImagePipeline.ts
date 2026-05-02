import '../config/env'; // validate env early
import { prisma } from '../config/db';
import { fetchAndStoreImageForFruit } from '../services/imageService';

const DELAY_MS  = 500; // courtesy delay between requests
const TARGET    = 5;   // desired ready images per fruit
const TOP_UP    = process.argv.includes('--top-up');  // re-run fruits with < TARGET images
const FORCE     = process.argv.includes('--force');   // re-run all fruits

async function main(): Promise<void> {
  let fruits: { id: string; nameEn: string; latinName: string }[];

  if (FORCE) {
    fruits = await prisma.fruit.findMany({
      select:  { id: true, nameEn: true, latinName: true },
      orderBy: { nameEn: 'asc' },
    });
  } else if (TOP_UP) {
    // Fruits with fewer than TARGET ready images
    const all = await prisma.fruit.findMany({
      select:  { id: true, nameEn: true, latinName: true, images: { where: { status: 'ready' }, select: { id: true } } },
      orderBy: { nameEn: 'asc' },
    });
    fruits = all.filter((f) => f.images.length < TARGET).map(({ id, nameEn, latinName }) => ({ id, nameEn, latinName }));
  } else {
    fruits = await prisma.fruit.findMany({
      select:  { id: true, nameEn: true, latinName: true },
      where:   { images: { none: { status: 'ready' } } },
      orderBy: { nameEn: 'asc' },
    });
  }

  if (fruits.length === 0) {
    console.log('All fruits already have ready images — nothing to do.');
    return;
  }

  console.log(`Processing images for ${fruits.length} fruit(s)…`);

  for (let i = 0; i < fruits.length; i++) {
    const fruit = fruits[i]!;
    console.log(`[${i + 1}/${fruits.length}] ${fruit.id}`);

    try {
      await fetchAndStoreImageForFruit(fruit.id, fruit.nameEn, fruit.latinName);
    } catch (err) {
      console.error(`  ✗ Failed for ${fruit.id}:`, err);
    }

    if (i < fruits.length - 1) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }

  console.log('Image pipeline complete.');
}

main()
  .catch((err) => {
    console.error('Pipeline failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
