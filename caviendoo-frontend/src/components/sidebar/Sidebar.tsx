'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Leaf, MapPin, X } from 'lucide-react';
import { FilterBar } from './FilterBar';
import { FruitListItem } from './FruitListItem';
import { getFruits, getMetrics } from '@/services/dataService';
import { useAtlasStore } from '@/store';
import type { Fruit, SiteMetrics } from '@/types';

// ── Metrics header ─────────────────────────────────────────────────────────

function MetricsHeader({ metrics }: { metrics: SiteMetrics }) {
  const t = useTranslations('metrics');
  return (
    <div className="flex items-center justify-around px-3 py-2.5 border-b border-border-parchment">
      <MetricItem value={metrics.totalFruits} label={t('fruits')} />
      <div className="w-px h-6 bg-border-parchment" />
      <MetricItem value={metrics.totalGovernorates} label={t('regions')} />
      <div className="w-px h-6 bg-border-parchment" />
      <MetricItem value={metrics.totalAOC} label={t('aoc')} accent />
    </div>
  );
}

function MetricItem({
  value,
  label,
  accent,
}: {
  value: number;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col items-center leading-none">
      <span
        className={[
          'font-serif text-xl font-semibold tabular-nums',
          accent ? 'text-gold' : 'text-ink',
        ].join(' ')}
      >
        {value}
      </span>
      <span className="text-2xs text-ink-muted mt-0.5 uppercase tracking-wider">{label}</span>
    </div>
  );
}

// ── Active region banner ────────────────────────────────────────────────────

function RegionBanner({
  name,
  count,
  onClear,
}: {
  name: string;
  count: number;
  onClear: () => void;
}) {
  const t = useTranslations('sidebar');
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-ink/5 border-b border-border-parchment">
      <MapPin size={11} className="text-gold shrink-0" />
      <span className="text-xs text-ink font-medium truncate flex-1">{name}</span>
      <span className="text-2xs text-ink-muted font-mono">{count}</span>
      <button
        onClick={onClear}
        className="text-ink-muted hover:text-ink transition-colors ms-1"
        aria-label="Clear region filter"
      >
        <X size={12} />
      </button>
    </div>
  );
}

// ── Empty state ─────────────────────────────────────────────────────────────

function EmptyState() {
  const t = useTranslations('sidebar');
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
      <Leaf size={28} className="text-ink-muted opacity-40" />
      <p className="text-sm text-ink-muted">{t('noResults')}</p>
    </div>
  );
}

// ── Main Sidebar ─────────────────────────────────────────────────────────────

export function Sidebar() {
  const t = useTranslations('sidebar');
  const [allFruits, setAllFruits] = useState<Fruit[]>([]);
  const [metrics, setMetrics] = useState<SiteMetrics>({
    totalFruits: 73,
    totalGovernorates: 24,
    totalAOC: 0,
  });
  const listRef = useRef<HTMLDivElement>(null);

  // Store slices
  const locale = useAtlasStore((s) => s.locale);
  const activeCategory = useAtlasStore((s) => s.activeCategory);
  const setActiveCategory = useAtlasStore((s) => s.setActiveCategory);
  const filterAOC = useAtlasStore((s) => s.filterAOC);
  const setFilterAOC = useAtlasStore((s) => s.setFilterAOC);
  const filterHeritage = useAtlasStore((s) => s.filterHeritage);
  const setFilterHeritage = useAtlasStore((s) => s.setFilterHeritage);
  const selectedGovernorate = useAtlasStore((s) => s.selectedGovernorate);
  const setSelectedGovernorate = useAtlasStore((s) => s.setSelectedGovernorate);
  const selectedFruitId = useAtlasStore((s) => s.selectedFruitId);
  const setSelectedFruitId = useAtlasStore((s) => s.setSelectedFruitId);
  const comparedFruitIds = useAtlasStore((s) => s.comparedFruitIds);
  const addToComparison = useAtlasStore((s) => s.addToComparison);
  const removeFromComparison = useAtlasStore((s) => s.removeFromComparison);

  const handleSelectFruit = useCallback(
    (id: string) => setSelectedFruitId(selectedFruitId === id ? null : id),
    [selectedFruitId, setSelectedFruitId]
  );

  const handleToggleCompare = useCallback(
    (id: string) => {
      if (comparedFruitIds.includes(id)) {
        removeFromComparison(id);
      } else {
        addToComparison(id);
      }
    },
    [comparedFruitIds, addToComparison, removeFromComparison]
  );

  // Load all fruits + metrics once
  useEffect(() => {
    getFruits()
      .then(setAllFruits)
      .catch(() => {
        // Silently fail — empty list shown, no crash
        setAllFruits([]);
      });
    getMetrics()
      .then(setMetrics)
      .catch(() => {/* Keep default metrics */});
  }, []);

  // Scroll list to top whenever filters change
  useEffect(() => {
    listRef.current?.scrollTo({ top: 0 });
  }, [activeCategory, filterAOC, filterHeritage, selectedGovernorate, locale]);

  // Client-side filtering + sorting (instant, no async)
  const filteredFruits = useMemo(() => {
    let result = allFruits;

    if (activeCategory) {
      result = result.filter((f) => f.category === activeCategory);
    }
    if (filterAOC) {
      result = result.filter((f) => f.isAOC);
    }
    if (filterHeritage) {
      result = result.filter((f) => f.isHeritage);
    }
    if (selectedGovernorate) {
      result = result.filter((f) => f.governorates.includes(selectedGovernorate));
      // Primary-governorate fruits rise to top
      result = [...result].sort((a, b) => {
        const ap = a.primaryGovernorate === selectedGovernorate ? 0 : 1;
        const bp = b.primaryGovernorate === selectedGovernorate ? 0 : 1;
        return ap - bp || a.name[locale].localeCompare(b.name[locale]);
      });
    } else {
      // Default: A-Z by current locale
      result = [...result].sort((a, b) =>
        a.name[locale].localeCompare(b.name[locale])
      );
    }

    return result;
  }, [allFruits, activeCategory, filterAOC, filterHeritage, selectedGovernorate, locale]);

  return (
    <div className="flex flex-col h-full">
      {/* Metrics header */}
      <MetricsHeader metrics={metrics} />

      {/* Filter bar */}
      <FilterBar
        locale={locale}
        activeCategory={activeCategory}
        filterAOC={filterAOC}
        filterHeritage={filterHeritage}
        onCategoryChange={setActiveCategory}
        onAOCChange={setFilterAOC}
        onHeritageChange={setFilterHeritage}
      />

      {/* Active region banner */}
      {selectedGovernorate && (
        <RegionBanner
          name={selectedGovernorate}
          count={filteredFruits.length}
          onClear={() => setSelectedGovernorate(null)}
        />
      )}

      {/* Fruit list */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto scrollbar-parchment"
      >
        {filteredFruits.length === 0 ? (
          <EmptyState />
        ) : (
          filteredFruits.map((fruit) => (
            <FruitListItem
              key={fruit.id}
              fruit={fruit}
              locale={locale}
              isSelected={selectedFruitId === fruit.id}
              onSelect={handleSelectFruit}
              isInComparison={comparedFruitIds.includes(fruit.id)}
              comparisonFull={comparedFruitIds.length >= 3}
              onToggleCompare={handleToggleCompare}
            />
          ))
        )}
      </div>

      {/* Filtered count footer */}
      {filteredFruits.length > 0 && (
        <div className="shrink-0 px-3 py-1.5 border-t border-border-parchment bg-parchment/80">
          <span className="text-2xs text-ink-muted">
            {filteredFruits.length !== metrics.totalFruits
              ? t('countFiltered', { count: filteredFruits.length, total: metrics.totalFruits })
              : t('countAll', { count: filteredFruits.length })}
          </span>
        </div>
      )}
    </div>
  );
}
