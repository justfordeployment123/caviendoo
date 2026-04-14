'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { X, GitCompareArrows } from 'lucide-react';
import { getFruitById } from '@/services/dataService';
import { useAtlasStore } from '@/store';
import type { Fruit } from '@/types';

import { FruitPhoto } from './FruitPhoto';
import { FruitBadgeRow } from './FruitBadgeRow';
import { LocalitiesStrip } from './LocalitiesStrip';
import { AOCHeritagePanel } from './AOCHeritagePanel';
import { EnvironmentalPanel } from './EnvironmentalPanel';
import { SeasonCalendar } from './SeasonCalendar';
import { NutritionalCard } from './NutritionalCard';
import { CulturalNotes } from './CulturalNotes';
import { GovernorateChips } from './GovernorateChips';

function Divider() {
  return <div className="mx-4 border-t border-border mb-3" />;
}

export function FruitDetailPanel() {
  const t = useTranslations('detail');

  const locale = useAtlasStore((s) => s.locale);
  const selectedFruitId = useAtlasStore((s) => s.selectedFruitId);
  const setSelectedFruitId = useAtlasStore((s) => s.setSelectedFruitId);
  const isDetailOpen = useAtlasStore((s) => s.isDetailOpen);
  const comparedFruitIds = useAtlasStore((s) => s.comparedFruitIds);
  const addToComparison = useAtlasStore((s) => s.addToComparison);

  const [fruit, setFruit] = useState<Fruit | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedFruitId) {
      setFruit(null);
      return;
    }
    setLoading(true);
    getFruitById(selectedFruitId).then((f) => {
      setFruit(f);
      setLoading(false);
    });
  }, [selectedFruitId]);

  const isInComparison = fruit ? comparedFruitIds.includes(fruit.id) : false;
  const comparisonFull = comparedFruitIds.length >= 3;

  const handleClose = () => setSelectedFruitId(null);

  const handleAddToCompare = () => {
    if (fruit && !isInComparison && !comparisonFull) {
      addToComparison(fruit.id);
    }
  };

  return (
    <aside
      className={[
        'flex flex-col bg-canvas border-s border-border overflow-hidden',
        'transition-all duration-300 ease-in-out',
        'order-last rtl:order-first rtl:border-s-0 rtl:border-e rtl:border-border',
        'lg:shrink-0 lg:relative lg:z-auto',
        'md:max-lg:absolute md:max-lg:inset-y-0 md:max-lg:end-0 md:max-lg:w-96 md:max-lg:z-30 md:max-lg:shadow-2xl',
        'max-md:fixed max-md:inset-0 max-md:w-full max-md:z-40',
        isDetailOpen
          ? 'w-full md:w-96 translate-x-0 opacity-100'
          : 'w-0 ltr:translate-x-full rtl:-translate-x-full opacity-0 pointer-events-none',
      ].join(' ')}
      aria-hidden={!isDetailOpen}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-border bg-surface">
        <div className="flex flex-col min-w-0">
          {fruit ? (
            <>
              <h2 className="font-serif text-lg leading-tight text-ink truncate">
                {fruit.name[locale]}
              </h2>
              <p className="font-arabic text-xs text-muted leading-tight truncate">
                {fruit.localName}
              </p>
            </>
          ) : (
            <div className="h-6 w-32 bg-ink/8 rounded animate-pulse" />
          )}
        </div>
        <button
          onClick={handleClose}
          className="shrink-0 ms-2 p-1.5 rounded text-muted hover:text-ink hover:bg-ink/5 transition-colors"
          aria-label={t('close')}
        >
          <X size={16} />
        </button>
      </div>

      {/* ── Scrollable body ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto scrollbar-dark">
        {loading && (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 rounded-full border-2 border-gold border-t-transparent animate-spin" />
          </div>
        )}

        {!loading && fruit && (
          <>
            <FruitPhoto fruit={fruit} />
            <FruitBadgeRow fruit={fruit} locale={locale} />
            <p className="px-4 pb-3 text-sm text-ink-muted leading-relaxed">
              {fruit.description[locale]}
            </p>
            <LocalitiesStrip localities={fruit.localities} />
            <AOCHeritagePanel fruit={fruit} />
            <Divider />
            <SeasonCalendar season={fruit.season} locale={locale} />
            <Divider />
            <EnvironmentalPanel env={fruit.environmental} />
            <Divider />
            <NutritionalCard fields={fruit.nutritional} locale={locale} />
            <Divider />
            <CulturalNotes fruit={fruit} locale={locale} />
            <Divider />
            <GovernorateChips fruit={fruit} />
            <div className="h-4" />
          </>
        )}
      </div>

      {/* ── Compare CTA footer ──────────────────────────────────────────── */}
      {fruit && (
        <div className="shrink-0 px-4 py-3 border-t border-border bg-surface">
          <button
            onClick={handleAddToCompare}
            disabled={isInComparison || comparisonFull}
            className={[
              'w-full flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors',
              isInComparison
                ? 'bg-gold/15 text-gold cursor-default border border-gold/40'
                : comparisonFull
                ? 'bg-ink/5 text-muted cursor-not-allowed'
                : 'bg-gold text-canvas border border-gold/80 hover:bg-gold-light',
            ].join(' ')}
          >
            <GitCompareArrows size={15} />
            {isInComparison
              ? t('compareAdded')
              : comparisonFull
              ? t('compareFull')
              : t('compare')}
          </button>
        </div>
      )}
    </aside>
  );
}
