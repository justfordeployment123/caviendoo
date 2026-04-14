'use client';

import { useTranslations } from 'next-intl';
import { MONTH_LABELS } from '@/types';
import type { SeasonData, Locale } from '@/types';

type MonthState = 'peak' | 'pre' | 'post' | 'off';

function getMonthState(month: number, season: SeasonData): MonthState {
  if (season.peak.includes(month)) return 'peak';
  if (season.pre.includes(month)) return 'pre';
  if (season.post.includes(month)) return 'post';
  return 'off';
}

const CELL_STYLES: Record<MonthState, string> = {
  peak: 'bg-emerald-600 text-white font-semibold',
  pre:  'bg-emerald-200 text-emerald-800',
  post: 'bg-emerald-100 text-emerald-700',
  off:  'bg-ink/5 text-muted/40',
};

export function SeasonCalendar({ season, locale }: { season: SeasonData; locale: Locale }) {
  const t = useTranslations('detail');
  const months = MONTH_LABELS[locale];

  return (
    <div className="px-4 pb-4">
      <p className="text-2xs text-muted uppercase tracking-wider mb-2.5 font-medium">
        {t('seasonCalendar')}
      </p>

      {/* 12-cell grid */}
      <div className="grid grid-cols-6 sm:grid-cols-12 gap-0.5">
        {Array.from({ length: 12 }, (_, i) => {
          const state = getMonthState(i, season);
          return (
            <div
              key={i}
              className={[
                'flex flex-col items-center justify-center rounded py-1.5 gap-0',
                CELL_STYLES[state],
              ].join(' ')}
            >
              <span className="text-2xs leading-none">{months[i]}</span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-2 flex-wrap">
        {(['peak', 'pre', 'post', 'off'] as MonthState[]).map((s) => (
          <div key={s} className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-sm ${CELL_STYLES[s]}`} />
            <span className="text-2xs text-muted">{t(`season_${s}`)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
