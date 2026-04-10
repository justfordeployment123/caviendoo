'use client';

import { useTranslations } from 'next-intl';

export function LocalitiesStrip({ localities }: { localities: string[] }) {
  const t = useTranslations('detail');

  if (localities.length === 0) return null;

  return (
    <div className="px-4 pb-3">
      <p className="text-2xs text-ink-muted uppercase tracking-wider mb-1.5">
        {t('localities')}
      </p>
      <div className="flex flex-wrap gap-1">
        {localities.map((loc) => (
          <span
            key={loc}
            className="text-xs px-2 py-0.5 rounded-full border border-cream/15 text-cream/60 bg-surface/40"
          >
            {loc}
          </span>
        ))}
      </div>
    </div>
  );
}
