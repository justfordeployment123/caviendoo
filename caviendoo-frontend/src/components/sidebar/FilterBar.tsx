'use client';

import { useTranslations } from 'next-intl';
import { CATEGORY_LABELS } from '@/types';
import type { FruitCategory, Locale } from '@/types';

const CATEGORIES: FruitCategory[] = [
  'citrus', 'stone', 'pomme', 'tropical', 'berry', 'dried', 'melon', 'other',
];

interface FilterBarProps {
  locale: Locale;
  activeCategory: FruitCategory | null;
  filterAOC: boolean;
  filterHeritage: boolean;
  onCategoryChange: (cat: FruitCategory | null) => void;
  onAOCChange: (v: boolean) => void;
  onHeritageChange: (v: boolean) => void;
}

export function FilterBar({
  locale,
  activeCategory,
  filterAOC,
  filterHeritage,
  onCategoryChange,
  onAOCChange,
  onHeritageChange,
}: FilterBarProps) {
  const t = useTranslations('sidebar');

  return (
    <div className="flex flex-col gap-0 border-b border-border-parchment">
      {/* Category tabs — horizontally scrollable */}
      <div className="flex overflow-x-auto scrollbar-parchment gap-0 px-1 pt-2 pb-0">
        {/* "All" tab */}
        <button
          onClick={() => onCategoryChange(null)}
          className={[
            'shrink-0 px-2.5 py-1.5 text-2xs font-medium rounded-t transition-colors whitespace-nowrap',
            activeCategory === null
              ? 'bg-ink text-parchment'
              : 'text-ink-muted hover:text-ink hover:bg-parchment-dark',
          ].join(' ')}
        >
          {t('allCategories')}
        </button>

        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => onCategoryChange(activeCategory === cat ? null : cat)}
            className={[
              'shrink-0 px-2.5 py-1.5 text-2xs font-medium rounded-t transition-colors whitespace-nowrap',
              activeCategory === cat
                ? 'bg-ink text-parchment'
                : 'text-ink-muted hover:text-ink hover:bg-parchment-dark',
            ].join(' ')}
          >
            {CATEGORY_LABELS[cat][locale]}
          </button>
        ))}
      </div>

      {/* Toggle row — AOC + Heritage */}
      <div className="flex items-center gap-3 px-3 py-2">
        <ToggleChip
          active={filterAOC}
          onChange={onAOCChange}
          label={t('filterAOC')}
          activeClass="bg-gold/20 border-gold text-gold"
        />
        <ToggleChip
          active={filterHeritage}
          onChange={onHeritageChange}
          label={t('filterHeritage')}
          activeClass="bg-[#6b3f1a]/20 border-[#6b3f1a] text-amber-800"
        />

        {/* Active filter count bubble */}
        {(filterAOC || filterHeritage || activeCategory) && (
          <span className="ms-auto text-2xs text-ink-muted">
            {[filterAOC, filterHeritage, activeCategory !== null].filter(Boolean).length} filter
            {[filterAOC, filterHeritage, activeCategory !== null].filter(Boolean).length > 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Small reusable toggle chip ─────────────────────────────────────────────

function ToggleChip({
  active,
  onChange,
  label,
  activeClass,
}: {
  active: boolean;
  onChange: (v: boolean) => void;
  label: string;
  activeClass: string;
}) {
  return (
    <button
      onClick={() => onChange(!active)}
      className={[
        'badge border transition-colors',
        active
          ? activeClass
          : 'border-border-parchment text-ink-muted hover:border-ink-muted hover:text-ink',
      ].join(' ')}
    >
      {label}
    </button>
  );
}
