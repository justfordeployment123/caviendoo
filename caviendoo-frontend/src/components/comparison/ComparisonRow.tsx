'use client';

import { MONTH_LABELS } from '@/types';
import type { Fruit, Locale, SeasonData } from '@/types';

// ── Season range helper ────────────────────────────────────────────────────

export function seasonRange(season: SeasonData, locale: Locale): string {
  const months = MONTH_LABELS[locale];
  if (!months) return '—';
  const all = [...(season.pre ?? []), ...(season.peak ?? []), ...(season.post ?? [])];
  if (all.length === 0) return '—';
  const valid = all.filter((m) => typeof m === 'number' && m >= 0 && m <= 11);
  if (valid.length === 0) return '—';
  const min = Math.min(...valid);
  const max = Math.max(...valid);
  const minLabel = months[min];
  const maxLabel = months[max];
  if (!minLabel || !maxLabel) return '—';
  return min === max ? minLabel : `${minLabel}–${maxLabel}`;
}

// ── Rank types & helpers ───────────────────────────────────────────────────

export type Rank = 'best' | 'worst' | 'mid' | 'only';

export function rankValues(values: number[], lowerIsBetter: boolean): Rank[] {
  if (values.length === 1) return ['only'];
  const min = Math.min(...values);
  const max = Math.max(...values);
  return values.map((v) => {
    if (v === min && v === max) return 'mid';
    if (lowerIsBetter) return v === min ? 'best' : v === max ? 'worst' : 'mid';
    return v === max ? 'best' : v === min ? 'worst' : 'mid';
  });
}

export const RANK_CLS: Record<Rank, string> = {
  best:  'text-emerald-700 font-semibold',
  worst: 'text-red-600',
  mid:   'text-ink',
  only:  'text-ink',
};

// ── Mini season calendar ───────────────────────────────────────────────────

export function MiniCalendar({ season, locale }: { season: SeasonData; locale: Locale }) {
  const months = MONTH_LABELS[locale];
  return (
    <div className="flex flex-wrap gap-px justify-center">
      {Array.from({ length: 12 }, (_, i) => {
        const isPeak = season.peak.includes(i);
        const isPre  = season.pre.includes(i);
        const isPost = season.post.includes(i);
        return (
          <div
            key={i}
            title={months[i]}
            className={[
              'w-4 h-4 rounded-sm flex items-center justify-center text-[9px] font-medium',
              isPeak  ? 'bg-emerald-600 text-white' :
              isPre   ? 'bg-emerald-200 text-emerald-800' :
              isPost  ? 'bg-emerald-100 text-emerald-700' :
                        'bg-ink/8 text-transparent',
            ].join(' ')}
          >
            {months[i][0]}
          </div>
        );
      })}
    </div>
  );
}

// ── Section divider row ────────────────────────────────────────────────────

export function SectionRow({ label, colCount }: { label: string; colCount: number }) {
  return (
    <tr className="bg-surface">
      <td
        colSpan={colCount + 1}
        className="px-3 pt-4 pb-1 text-2xs text-muted uppercase tracking-widest border-b border-border font-medium"
      >
        {label}
      </td>
    </tr>
  );
}

// ── Data row ───────────────────────────────────────────────────────────────

interface DataRowProps {
  label: string;
  fruits: Fruit[];
  render: (f: Fruit, i: number) => React.ReactNode;
  ranks?: Rank[];
}

export function DataRow({ label, fruits, render, ranks }: DataRowProps) {
  return (
    <tr className="border-b border-border/40 hover:bg-ink/[0.02] transition-colors">
      <td className="px-3 py-2 text-xs text-muted whitespace-nowrap align-middle min-w-[110px]">
        {label}
      </td>
      {fruits.map((f, i) => (
        <td
          key={f.id}
          className={[
            'px-3 py-2 text-center align-middle border-s border-border/30',
            ranks ? RANK_CLS[ranks[i]] : 'text-ink',
          ].join(' ')}
        >
          {render(f, i)}
        </td>
      ))}
    </tr>
  );
}
