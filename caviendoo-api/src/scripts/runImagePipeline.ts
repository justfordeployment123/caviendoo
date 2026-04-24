import '../../config/env'; // validate env early
import { prisma } from '../../config/db';
import { fetchAndStoreImageForFruit } from '../../services/imageService';

const DELAY_MS = 500; // courtesy delay between requests

async function main(): Promise<void> {
  const fruits = await prisma.fruit.findMany({
    select: { id: true, nameEn: true, latinName: true },
    where:  {
      images: { none: { status: 'ready' } },
    },
    orderBy: { nameEn: 'asc' },
  });

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
