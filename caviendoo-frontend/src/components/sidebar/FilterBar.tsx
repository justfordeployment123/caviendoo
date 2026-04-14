'use client';

import { useTranslations } from 'next-intl';
import { CATEGORY_LABELS } from '@/types';
import type { FruitCategory, Locale } from '@/types';

const CATEGORIES: FruitCategory[] = [
  'citrus', 'stone', 'pomme', 'tropical', 'berry', 'dried', 'melon', 'other',
];

// ── Tooltip texts (will be replaced by translation keys in full i18n pass) ──
const AOC_TOOLTIP =
  "Appellation d'Origine Contrôlée — a legally protected designation guaranteeing this product's geographic origin and certified quality standards.";

const HERITAGE_TOOLTIP =
  'Heritage Variety — a traditional cultivar preserved by local Tunisian farming communities for generations, representing the country\'s living agricultural biodiversity.';

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
      {/* Category tabs */}
      <div className="flex overflow-x-auto scrollbar-parchment gap-0 px-1 pt-2 pb-0">
        <button
          onClick={() => onCategoryChange(null)}
          className={[
            'shrink-0 px-2.5 py-1.5 text-2xs font-medium rounded-t transition-colors whitespace-nowrap',
            activeCategory === null
              ? 'bg-ink text-canvas'
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
                ? 'bg-ink text-canvas'
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
          tooltip={AOC_TOOLTIP}
          activeClass="bg-gold/15 border-gold text-gold"
        />
        <ToggleChip
          active={filterHeritage}
          onChange={onHeritageChange}
          label={'♦ ' + t('filterHeritage')}
          tooltip={HERITAGE_TOOLTIP}
          activeClass="bg-amber-100 border-amber-400 text-amber-700"
        />

        {(filterAOC || filterHeritage || activeCategory) && (
          <span className="ms-auto text-2xs text-ink-muted">
            {[filterAOC, filterHeritage, activeCategory !== null].filter(Boolean).length} filter
            {[filterAOC, filterHeritage, activeCategory !== null].filter(Boolean).length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Badge legend — visible only when no filters are active */}
      {!filterAOC && !filterHeritage && !activeCategory && (
        <div className="px-3 pb-2 flex items-center gap-3">
          <span className="text-2xs text-ink-muted flex items-center gap-1">
            <span className="badge bg-gold/15 border border-gold text-gold px-1.5">AOC</span>
            <span>= Protected origin</span>
          </span>
          <span className="text-2xs text-ink-muted flex items-center gap-1">
            <span className="badge bg-amber-100 border border-amber-400 text-amber-700 px-1.5">♦</span>
            <span>= Heritage variety</span>
          </span>
        </div>
      )}
    </div>
  );
}

// ── Small reusable toggle chip ─────────────────────────────────────────────

function ToggleChip({
  active,
  onChange,
  label,
  tooltip,
  activeClass,
}: {
  active: boolean;
  onChange: (v: boolean) => void;
  label: string;
  tooltip: string;
  activeClass: string;
}) {
  return (
    <button
      onClick={() => onChange(!active)}
      title={tooltip}
      aria-label={`${label} — ${tooltip}`}
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
