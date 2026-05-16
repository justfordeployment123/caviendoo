'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search, Info, Globe, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { useAtlasStore } from '@/store';
import { getMetrics } from '@/services/dataService';
import { SearchDropdown } from './SearchDropdown';
import { InfoTooltip } from './InfoTooltip';
import type { SiteMetrics, OverlayMode, Locale } from '@/types';

// ── Overlay mode data ──────────────────────────────────────────────────────

const OVERLAY_INFO: Record<OverlayMode, { title: string; body: string }> = {
  'recoltes': {
    title: 'Harvest Density',
    body:  'Colours each governorate by the number of distinct fruit varieties actively grown and harvested there. Darker green = more varieties cultivated in that region.',
  },
  'stress-hydrique': {
    title: 'Water Stress (Aquifer)',
    body:  'Shows the groundwater (aquifer) depletion pressure per region as a percentage. Red = critically over-extracted. High water stress means irrigation sustainability is at risk.',
  },
  'indice-uv': {
    title: 'UV Index at Harvest',
    body:  'Peak UV radiation index during the main harvest season (WHO scale 1–11+). High UV accelerates sugar development but can cause sunburn on thin-skinned fruit.',
  },
};

const OVERLAY_MODES: { key: OverlayMode; labelKey: string }[] = [
  { key: 'recoltes',        labelKey: 'recoltes'       },
  { key: 'stress-hydrique', labelKey: 'stressHydrique' },
  { key: 'indice-uv',       labelKey: 'indiceUv'       },
];

// ── Overlay toggle ─────────────────────────────────────────────────────────
// ⓘ icons sit OUTSIDE each button to avoid nested-button HTML violations
// and to not affect button width.

function OverlayToggle({ className = '' }: { className?: string }) {
  const t           = useTranslations('overlay');
  const overlayMode = useAtlasStore((s) => s.overlayMode);
  const setOverlayMode = useAtlasStore((s) => s.setOverlayMode);

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div
        className="flex w-full items-stretch rounded-md border border-border overflow-hidden"
        role="group"
        aria-label="Map overlay mode"
      >
        {OVERLAY_MODES.map(({ key, labelKey }) => {
          const active = overlayMode === key;
          return (
            <button
              key={key}
              onClick={() => setOverlayMode(key)}
              className={[
                'px-1 sm:px-3 py-1.5 text-[10px] sm:text-xs font-medium tracking-wide transition-colors',
                'leading-tight flex items-center justify-center focus-visible:outline-none flex-1',
                active
                  ? 'bg-gold text-canvas font-semibold'
                  : 'bg-surface text-muted hover:text-ink hover:bg-surface-raised',
              ].join(' ')}
            >
              {t(labelKey as 'recoltes' | 'stressHydrique' | 'indiceUv')}
            </button>
          );
        })}
      </div>

      {/* Single shared ⓘ — shows info about the currently active overlay */}
      <InfoTooltip
        title={OVERLAY_INFO[overlayMode].title}
        body={OVERLAY_INFO[overlayMode].body}
        iconSize={13}
      />
    </div>
  );
}

// ── Metrics chips ─────────────────────────────────────────────────────────

function MetricsBar({ metrics }: { metrics: SiteMetrics }) {
  const t = useTranslations('metrics');
  return (
    <div className="hidden xl:flex items-center gap-3 text-xs font-mono text-muted">
      <span className="flex items-center gap-1">
        <span className="text-ink font-medium tabular-nums">{metrics.totalFruits}</span>
        <span>{t('fruits')}</span>
      </span>
      <span className="text-border">|</span>
      <span className="flex items-center gap-1">
        <span className="text-ink font-medium tabular-nums">{metrics.totalGovernorates}</span>
        <span>{t('regions')}</span>
      </span>
      <span className="text-border">|</span>
      <span className="flex items-center gap-1">
        <span className="text-gold font-medium tabular-nums">{metrics.totalAOC}</span>
        <span className="text-gold">{t('aoc')}</span>
      </span>
    </div>
  );
}

// ── Search input ──────────────────────────────────────────────────────────

function SearchInput() {
  const t               = useTranslations('search');
  const setSearchQuery  = useAtlasStore((s) => s.setSearchQuery);
  const setIsSearchOpen = useAtlasStore((s) => s.setIsSearchOpen);
  const inputRef        = useRef<HTMLInputElement>(null);

  return (
    <div className="relative">
      <Search
        size={13}
        className="absolute start-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
      />
      <input
        ref={inputRef}
        type="text"
        placeholder={t('placeholder')}
        autoComplete="off"
        role="combobox"
        aria-expanded="true"
        aria-haspopup="listbox"
        aria-autocomplete="list"
        className={[
          'w-24 sm:w-28 lg:w-44 ps-7 pe-2 py-1.5',
          'bg-surface border border-border rounded-md',
          'text-xs text-ink placeholder:text-muted',
          'focus:outline-none focus:border-gold focus:bg-canvas',
          'transition-colors',
        ].join(' ')}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={() => setIsSearchOpen(true)}
      />
      <SearchDropdown inputRef={inputRef} />
    </div>
  );
}

// ── Language switcher ─────────────────────────────────────────────────────

const LOCALES: Locale[] = ['en', 'fr', 'ar'];

function LanguageSwitcher() {
  const locale    = useAtlasStore((s) => s.locale);
  const setLocale = useAtlasStore((s) => s.setLocale);

  function switchLocale(next: Locale) {
    setLocale(next);
    const dir = next === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('lang', next);
    document.documentElement.setAttribute('dir', dir);
  }

  return (
    <div
      className="flex items-center rounded-md border border-border overflow-hidden shrink-0"
      role="group"
      aria-label="Language"
    >
      {LOCALES.map((l) => {
        const active = locale === l;
        return (
          <button
            key={l}
            onClick={() => switchLocale(l)}
            className={[
              'px-1.5 sm:px-2 py-1.5 text-2xs sm:text-xs font-medium uppercase tracking-wider transition-colors',
              'focus-visible:outline-none',
              active
                ? 'bg-gold text-canvas font-semibold'
                : 'bg-surface text-muted hover:text-ink hover:bg-surface-raised',
            ].join(' ')}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}

// ── Top Bar ───────────────────────────────────────────────────────────────

interface TopBarProps {
  onAbout?: () => void;
}

export function TopBar({ onAbout }: TopBarProps) {
  const [metrics, setMetrics] = useState<SiteMetrics>({
    totalFruits: 73,
    totalGovernorates: 24,
    totalAOC: 0,
  });

  useEffect(() => {
    getMetrics().then(setMetrics).catch(() => {/* keep defaults */});
  }, []);

  return (
    <header className="flex-none flex flex-col w-full bg-surface border-b border-border z-20 relative">

      {/* ── Row 1 ─────────────────────────────────────────────────────── */}
      <div className="flex items-center px-2 sm:px-4 gap-2 sm:gap-3 h-14 sm:h-16 min-w-0">

        {/* Logo */}
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
          <Image
            src="/caviendoo_logo.png"
            alt="Caviendoo Logo"
            width={60}
            height={60}
            className="object-contain w-8 h-8 sm:w-10 sm:h-10 shrink-0 animate-spin-globe"
            priority
          />
          <span className="block font-serif text-sm sm:text-xl font-semibold text-ink tracking-widest uppercase leading-none pb-0.5 truncate">
            Caviendoo
          </span>
          <span className="hidden xl:block text-2xs text-muted tracking-widest uppercase ps-2 border-s border-border whitespace-nowrap">
            Agricultural Intelligence
          </span>
        </div>

        {/* Overlay toggle — desktop only (lg+), centred */}
        <div className="hidden lg:flex flex-1 justify-center min-w-0">
          <OverlayToggle />
        </div>

        {/* Right-side controls — shrink-0 to never overflow */}
        <div className="flex items-center gap-1 sm:gap-1.5 ms-auto shrink-0">
          {/* Metrics — only on xl+ to avoid overflow on smaller desktops */}
          <MetricsBar metrics={metrics} />
          <div className="hidden xl:block w-px h-4 bg-border" />
          {/* Search — visible on all sizes now */}
          <div className="block">
            <SearchInput />
          </div>
          <div className="w-px h-4 bg-border shrink-0" />
          <LanguageSwitcher />
          {onAbout && (
            <>
              <div className="w-px h-4 bg-border shrink-0" />
              <button
                onClick={onAbout}
                className="shrink-0 p-1.5 rounded text-muted hover:text-ink hover:bg-ink/5 transition-colors"
                aria-label="About Caviendoo"
                title="About Caviendoo"
              >
                <Info size={15} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Row 2: Overlay toggle — below lg (mobile + tablet) ─────── */}
      <div className="flex w-full lg:hidden border-t border-border/40 px-2 sm:px-3 py-1.5 bg-surface z-10">
        <OverlayToggle className="w-full" />
      </div>

    </header>
  );
}
