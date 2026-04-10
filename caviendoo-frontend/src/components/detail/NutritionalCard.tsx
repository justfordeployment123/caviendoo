'use client';

import { useTranslations } from 'next-intl';
import type { NutritionalField, Locale } from '@/types';

export function NutritionalCard({
  fields,
  locale,
}: {
  fields: NutritionalField[];
  locale: Locale;
}) {
  const t = useTranslations('detail');

  if (fields.length === 0) return null;

  return (
    <div className="px-4 pb-4">
      <p className="text-2xs text-ink-muted uppercase tracking-wider mb-2.5">
        {t('nutritional')}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 bg-surface/30 rounded-md px-3 py-2.5">
        {fields.map((field, i) => (
          <div key={i} className="flex items-center justify-between gap-1">
            <span className="text-2xs text-cream/50 truncate">{field.label[locale]}</span>
            <span className="font-mono text-xs text-cream/80 shrink-0">{field.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
