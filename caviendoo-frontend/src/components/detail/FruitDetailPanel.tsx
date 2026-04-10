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

// ── Section divider ────────────────────────────────────────────────────────

function Divider() {
  return <div className="mx-4 border-t border-white/8 mb-3" />;
}

// ── Main panel ─────────────────────────────────────────────────────────────

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

  const handleClose = () => {
    setSelectedFruitId(null);
  };

  const handleAddToCompare = () => {
    if (fruit && !isInComparison && !comparisonFull) {
      addToComparison(fruit.id);
    }
  };

  return (
    <aside
      className={[
        'flex flex-col bg-canvas border-s border-white/8 overflow-hidden',
        'transition-all duration-300 ease-in-out',
        // Flex order: last in LTR (right side), first in RTL (left side)
        'order-last rtl:order-first rtl:border-s-0 rtl:border-e rtl:border-white/8',
        // lg+: inline flex column
        'lg:shrink-0 lg:relative lg:z-auto',
        // md: absolute overlay on top of map
        'md:max-lg:absolute md:max-lg:inset-y-0 md:max-lg:end-0 md:max-lg:w-96 md:max-lg:z-30 md:max-lg:shadow-2xl',
        // sm: fixed full-screen
        'max-md:fixed max-md:inset-0 max-md:w-full max-md:z-40',
        isDetailOpen
          ? 'w-full md:w-96 translate-x-0 opacity-100'
          : 'w-0 ltr:translate-x-full rtl:-translate-x-full opacity-0 pointer-events-none',
      ].join(' ')}
      aria-hidden={!isDetailOpen}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/8">
        <div className="flex flex-col min-w-0">
          {fruit ? (
            <>
              <h2 className="font-serif text-lg leading-tight text-cream truncate">
                {fruit.name[locale]}
              </h2>
              <p className="font-arabic text-xs text-cream/50 leading-tight truncate">
                {fruit.localName}
              </p>
            </>
          ) : (
            <div className="h-6 w-32 bg-white/8 rounded animate-pulse" />
          )}
        </div>
        <button
          onClick={handleClose}
          className="shrink-0 ms-2 p-1.5 rounded text-cream/40 hover:text-cream hover:bg-white/8 transition-colors"
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
            {/* Hero photo */}
            <FruitPhoto fruit={fruit} />

            {/* Badge row */}
            <FruitBadgeRow fruit={fruit} locale={locale} />

            {/* Description */}
            <p className="px-4 pb-3 text-sm text-cream/70 leading-relaxed">
              {fruit.description[locale]}
            </p>

            {/* Localities */}
            <LocalitiesStrip localities={fruit.localities} />

            {/* AOC / Heritage */}
            <AOCHeritagePanel fruit={fruit} />

            <Divider />

            {/* Season calendar */}
            <SeasonCalendar season={fruit.season} locale={locale} />

            <Divider />

            {/* Environmental panel */}
            <EnvironmentalPanel env={fruit.environmental} />

            <Divider />

            {/* Nutritional */}
            <NutritionalCard fields={fruit.nutritional} locale={locale} />

            <Divider />

            {/* Cultural notes */}
            <CulturalNotes fruit={fruit} locale={locale} />

            <Divider />

            {/* Growing regions */}
            <GovernorateChips fruit={fruit} />

            {/* Bottom padding */}
            <div className="h-4" />
          </>
        )}
      </div>

      {/* ── Compare CTA footer ──────────────────────────────────────────── */}
      {fruit && (
        <div className="shrink-0 px-4 py-3 border-t border-white/8 bg-canvas">
          <button
            onClick={handleAddToCompare}
            disabled={isInComparison || comparisonFull}
            className={[
              'w-full flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors',
              isInComparison
                ? 'bg-gold/20 text-gold cursor-default'
                : comparisonFull
                ? 'bg-white/5 text-cream/30 cursor-not-allowed'
                : 'bg-gold/15 text-gold border border-gold/40 hover:bg-gold/25',
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
