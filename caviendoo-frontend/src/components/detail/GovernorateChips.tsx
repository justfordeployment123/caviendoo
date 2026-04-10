'use client';

import { useTranslations } from 'next-intl';
import { useAtlasStore } from '@/store';
import type { Fruit } from '@/types';

export function GovernorateChips({ fruit }: { fruit: Fruit }) {
  const t = useTranslations('detail');
  const setSelectedGovernorate = useAtlasStore((s) => s.setSelectedGovernorate);
  const selectedGovernorate = useAtlasStore((s) => s.selectedGovernorate);

  if (fruit.governorates.length === 0) return null;

  return (
    <div className="px-4 pb-4">
      <p className="text-2xs text-ink-muted uppercase tracking-wider mb-2">
        {t('growingRegions')}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {fruit.governorates.map((gov) => {
          const isPrimary = gov === fruit.primaryGovernorate;
          const isActive = gov === selectedGovernorate;

          return (
            <button
              key={gov}
              onClick={() => setSelectedGovernorate(isActive ? null : gov)}
              className={[
                'text-xs px-2.5 py-1 rounded-full border transition-colors',
                isActive
                  ? 'bg-gold/20 border-gold text-gold'
                  : isPrimary
                  ? 'border-cream/30 text-cream/80 hover:border-cream/50 hover:text-cream'
                  : 'border-cream/15 text-cream/50 hover:border-cream/30 hover:text-cream/70',
              ].join(' ')}
            >
              {gov}
              {isPrimary && (
                <span className="ms-1 text-gold text-2xs">★</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
