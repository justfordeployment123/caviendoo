'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { X, GitCompareArrows } from 'lucide-react';
import { useAtlasStore } from '@/store';
import { useEffect, useState } from 'react';
import { getFruitById } from '@/services/dataService';
import type { Fruit } from '@/types';

export function ComparisonBar() {
  const t = useTranslations('comparison');

  const comparedFruitIds = useAtlasStore((s) => s.comparedFruitIds);
  const removeFromComparison = useAtlasStore((s) => s.removeFromComparison);
  const clearComparison = useAtlasStore((s) => s.clearComparison);
  const setIsComparisonOpen = useAtlasStore((s) => s.setIsComparisonOpen);

  const [fruits, setFruits] = useState<(Fruit | null)[]>([]);

  useEffect(() => {
    Promise.all(comparedFruitIds.map((id) => getFruitById(id))).then(setFruits);
  }, [comparedFruitIds]);

  if (comparedFruitIds.length === 0) return null;

  return (
    <div
      className={[
        'fixed inset-x-0 z-40',
        'bottom-0 md:bottom-0 comparison-bar-mobile',
        'bg-surface border-t border-border',
        'flex items-center gap-3 px-4 py-2.5',
        'shadow-[0_-4px_16px_rgba(26,42,10,0.1)]',
        'transition-transform duration-300',
      ].join(' ')}
    >
      <span className="text-xs text-muted shrink-0 hidden sm:block">
        {t('slots', { count: comparedFruitIds.length })}
      </span>

      <div className="flex items-center gap-2 flex-1 min-w-0">
        {fruits.map((fruit) => {
          if (!fruit) return null;
          return (
            <div
              key={fruit.id}
              className="flex items-center gap-1.5 bg-surface-raised border border-border rounded-lg px-2 py-1 shrink-0"
            >
              <div className="relative w-6 h-6 rounded overflow-hidden shrink-0 border border-border">
                <Image
                  src={fruit.thumbnailUrl}
                  alt={fruit.name.en}
                  width={24}
                  height={24}
                  className="object-cover w-full h-full"
                  unoptimized
                />
              </div>
              <span className="text-xs text-ink max-w-[100px] truncate">
                {fruit.name.en}
              </span>
              <button
                onClick={() => removeFromComparison(fruit.id)}
                className="text-muted hover:text-ink transition-colors ms-0.5"
                aria-label={`Remove ${fruit.name.en}`}
              >
                <X size={11} />
              </button>
            </div>
          );
        })}

        {Array.from({ length: 3 - comparedFruitIds.length }, (_, i) => (
          <div
            key={`empty-${i}`}
            className="w-8 h-8 rounded-lg border border-dashed border-border flex items-center justify-center shrink-0"
          >
            <span className="text-muted text-lg leading-none pb-0.5">+</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={clearComparison}
          className="text-xs text-muted hover:text-ink transition-colors px-2 py-1 rounded hover:bg-ink/5"
        >
          {t('clear')}
        </button>

        <button
          onClick={() => setIsComparisonOpen(true)}
          disabled={comparedFruitIds.length < 2}
          className={[
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
            comparedFruitIds.length >= 2
              ? 'bg-gold text-canvas hover:bg-gold-light'
              : 'bg-ink/5 text-muted cursor-not-allowed',
          ].join(' ')}
        >
          <GitCompareArrows size={13} />
          {t('title')}
        </button>
      </div>
    </div>
  );
}
