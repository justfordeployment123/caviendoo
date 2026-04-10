'use client';

import { useTranslations } from 'next-intl';
import type { Fruit, Locale } from '@/types';

export function CulturalNotes({ fruit, locale }: { fruit: Fruit; locale: Locale }) {
  const t = useTranslations('detail');
  const text = fruit.culturalNotes[locale];

  if (!text) return null;

  return (
    <div className="px-4 pb-4">
      <p className="text-2xs text-ink-muted uppercase tracking-wider mb-2">
        {t('culturalNotes')}
      </p>
      <p className="font-serif text-sm text-cream/70 leading-relaxed italic">
        {text}
      </p>
    </div>
  );
}
