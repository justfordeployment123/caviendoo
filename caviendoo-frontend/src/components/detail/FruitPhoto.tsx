'use client';

import Image from 'next/image';
import type { Fruit } from '@/types';

// 2-px category accent bar colours
const CATEGORY_ACCENT: Record<string, string> = {
  citrus:   'bg-amber-500',
  stone:    'bg-rose-600',
  pomme:    'bg-emerald-600',
  tropical: 'bg-purple-600',
  berry:    'bg-red-700',
  dried:    'bg-[#6b3f1a]',
  melon:    'bg-lime-600',
  other:    'bg-slate-500',
};

export function FruitPhoto({ fruit }: { fruit: Fruit }) {
  return (
    // Fixed height of 170px per client spec (160-180px range)
    <div className="relative w-full bg-surface overflow-hidden shrink-0" style={{ height: 170 }}>
      <Image
        src={fruit.photoUrl}
        alt={fruit.name.en}
        fill
        className="object-cover"
        unoptimized
        priority
      />
      {/* Gradient overlay — bottom fade */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent pointer-events-none" />

      {/* Latin name — bottom-left */}
      <p className="absolute bottom-2 start-3 text-2xs text-white/80 font-mono italic leading-none pointer-events-none">
        {fruit.latinName}
      </p>

      {/* Category colour bar */}
      <div className={`absolute bottom-0 inset-x-0 h-0.5 ${CATEGORY_ACCENT[fruit.category] ?? 'bg-slate-500'}`} />
    </div>
  );
}
