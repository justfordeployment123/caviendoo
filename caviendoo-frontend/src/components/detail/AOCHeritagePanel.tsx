'use client';

import { useTranslations } from 'next-intl';
import type { Fruit } from '@/types';

export function AOCHeritagePanel({ fruit }: { fruit: Fruit }) {
  const t = useTranslations('detail');

  if (!fruit.isAOC && !fruit.isHeritage) return null;

  return (
    <div className="mx-4 mb-3 rounded-md border border-gold/30 bg-gold/5 px-3 py-2.5 flex flex-col gap-1.5">
      {fruit.isAOC && (
        <div className="flex items-start gap-2">
          <span className="badge bg-gold/20 border border-gold text-gold text-2xs shrink-0 mt-0.5">
            AOC
          </span>
          <p className="text-xs text-cream/70 leading-snug">
            {t('aocDescription')}
          </p>
        </div>
      )}
      {fruit.isHeritage && (
        <div className="flex items-start gap-2">
          <span className="badge bg-[#6b3f1a]/30 border border-[#6b3f1a] text-amber-300 text-2xs shrink-0 mt-0.5">
            ♦
          </span>
          <p className="text-xs text-cream/70 leading-snug">
            {t('heritageDescription')}
          </p>
        </div>
      )}
    </div>
  );
}
