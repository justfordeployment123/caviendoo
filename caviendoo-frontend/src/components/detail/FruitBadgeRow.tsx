'use client';

import { useTranslations } from 'next-intl';
import { CategoryBadge } from '@/components/sidebar/CategoryBadge';
import { MONTH_LABELS } from '@/types';
import type { Fruit, Locale } from '@/types';

function seasonRange(season: Fruit['season'], locale: Locale): string {
  const months = MONTH_LABELS[locale];
  const all = [...season.pre, ...season.peak, ...season.post];
  if (all.length === 0) return '—';
  const min = Math.min(...all);
  const max = Math.max(...all);
  return min === max ? months[min] : `${months[min]}–${months[max]}`;
}

export function FruitBadgeRow({ fruit, locale }: { fruit: Fruit; locale: Locale }) {
  const range = seasonRange(fruit.season, locale);

  return (
    <div className="flex items-center flex-wrap gap-1.5 px-4 py-2.5">
      {/* Zone pill */}
      <span className="badge border border-border text-ink-muted text-2xs bg-surface">
        {fruit.zone[locale]}
      </span>

      {/* Category badge */}
      <CategoryBadge category={fruit.category} locale={locale} size="xs" />

      {/* Season range pill */}
      <span className="badge border border-border text-muted text-2xs font-mono bg-surface">
        {range}
      </span>
    </div>
  );
}
