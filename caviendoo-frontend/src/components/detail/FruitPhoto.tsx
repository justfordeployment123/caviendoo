'use client';

import Image from 'next/image';
import { CATEGORY_COLORS } from '@/types';
import type { Fruit } from '@/types';

// 2-px category accent bar colours (border-b style)
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
    <div className="relative w-full aspect-[16/9] bg-surface overflow-hidden shrink-0">
      <Image
        src={fruit.photoUrl}
        alt={fruit.name.en}
        fill
        className="object-cover"
        unoptimized
        priority
      />
      {/* Gradient overlay — bottom fade for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-canvas/80 via-transparent to-transparent pointer-events-none" />

      {/* Latin name — bottom-left */}
      <p className="absolute bottom-2 start-3 text-2xs text-cream/70 font-mono italic leading-none pointer-events-none">
        {fruit.latinName}
      </p>

      {/* Category colour bar — bottom edge */}
      <div className={`absolute bottom-0 inset-x-0 h-0.5 ${CATEGORY_ACCENT[fruit.category] ?? 'bg-slate-500'}`} />
    </div>
  );
}
