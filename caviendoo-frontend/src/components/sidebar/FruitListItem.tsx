'use client';

import { memo } from 'react';
import Image from 'next/image';
import { GitCompareArrows } from 'lucide-react';
import { CategoryBadge } from './CategoryBadge';
import { AOCBadge } from './AOCBadge';
import { HeritageBadge } from './HeritageBadge';
import type { Fruit, Locale } from '@/types';

interface FruitListItemProps {
  fruit: Fruit;
  locale: Locale;
  isSelected: boolean;
  onSelect: (id: string) => void;
  isInComparison: boolean;
  comparisonFull: boolean;
  onToggleCompare: (id: string) => void;
}

export const FruitListItem = memo(function FruitListItem({
  fruit,
  locale,
  isSelected,
  onSelect,
  isInComparison,
  comparisonFull,
  onToggleCompare,
}: FruitListItemProps) {
  return (
    <div
      className={[
        'w-full flex items-center gap-2.5 px-3 py-2',
        'border-b border-border-parchment/60 last:border-b-0',
        isSelected ? 'bg-parchment-dark' : 'hover:bg-parchment-dark/60',
      ].join(' ')}
    >
      {/* Clickable area: thumbnail + text */}
      <button
        onClick={() => onSelect(fruit.id)}
        className="flex items-center gap-2.5 flex-1 min-w-0 text-start cursor-pointer"
      >
        {/* Thumbnail — 42×42px with 1px olive border per spec */}
        <div className="relative shrink-0 w-[42px] h-[42px] rounded overflow-hidden bg-parchment-dark border border-border">
          <Image
            src={fruit.thumbnailUrl}
            alt={fruit.name.en}
            width={42}
            height={42}
            className="object-cover w-full h-full"
            unoptimized
            loading="lazy"
          />
          {isSelected && (
            <span className="absolute inset-y-0 start-0 w-0.5 bg-gold" />
          )}
        </div>

        {/* Text block */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-sm font-medium leading-snug truncate text-ink">
              {fruit.name[locale]}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              {fruit.isAOC && <AOCBadge />}
              {fruit.isHeritage && <HeritageBadge />}
            </div>
          </div>
          <p className="font-arabic text-xs text-ink-muted leading-snug mt-0 truncate">
            {fruit.localName}
          </p>
          <div className="flex items-center justify-between gap-1 mt-0.5">
            <CategoryBadge category={fruit.category} locale={locale} />
            <span className="text-2xs text-ink-muted truncate max-w-[80px] text-end">
              {fruit.primaryGovernorate}
            </span>
          </div>
        </div>
      </button>

      {/* Compare toggle button */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleCompare(fruit.id); }}
        disabled={!isInComparison && comparisonFull}
        aria-label={isInComparison ? 'Remove from comparison' : 'Add to comparison'}
        className={[
          'shrink-0 w-6 h-6 flex items-center justify-center rounded transition-colors',
          isInComparison
            ? 'text-gold bg-gold/15 hover:bg-gold/25'
            : comparisonFull
            ? 'text-ink-muted/30 cursor-not-allowed'
            : 'text-ink-muted hover:text-gold hover:bg-gold/10',
        ].join(' ')}
      >
        <GitCompareArrows size={12} />
      </button>
    </div>
  );
});
