'use client';

import { memo } from 'react';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '@/types';
import type { FruitCategory, Locale } from '@/types';

interface CategoryBadgeProps {
  category: FruitCategory;
  locale: Locale;
  size?: 'sm' | 'xs';
}

export const CategoryBadge = memo(function CategoryBadge({ category, locale, size = 'xs' }: CategoryBadgeProps) {
  const colorClass = CATEGORY_COLORS[category];
  const label = CATEGORY_LABELS[category][locale];

  return (
    <span
      className={[
        'badge shrink-0',
        colorClass,
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-2xs px-1.5 py-0',
      ].join(' ')}
    >
      {label}
    </span>
  );
});
