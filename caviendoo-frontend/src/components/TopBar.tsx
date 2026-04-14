'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search, Leaf, Info } from 'lucide-react';
import { useAtlasStore } from '@/store';
import { getMetrics } from '@/services/dataService';
import { SearchDropdown } from './SearchDropdown';
import type { SiteMetrics, OverlayMode, Locale } from '@/types';

// ── Overlay mode segmented control ────────────────────────────────────────

const OVERLAY_MODES: { key: OverlayMode; labelKey: string }[] = [
  { key: 'recoltes',        labelKey: 'recoltes'       },
  { key: 'stress-hydrique', labelKey: 'stressHydrique' },
  { key: 'indice-uv',       labelKey: 'indiceUv'       },
];

function OverlayToggle({ className = '' }: { className?: string }) {
  const t = useTranslations('overlay');
  const overlayMode    = useAtlasStore((s) => s.overlayMode);
  const setOverlayMode = useAtlasStore((s) => s.setOverlayMode);

  return (
    <div
      className={[
        'flex items-center rounded-md border border-border overflow-hidden',
        className,
      ].join(' ')}
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
              'flex-1 px-3 py-1.5 text-xs font-medium tracking-wide transition-colors',
              'whitespace-nowrap focus-visible:outline-none',
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
  );
}

// ── Metrics chips ─────────────────────────────────────────────────────────

function MetricsBar({ metrics }: { metrics: SiteMetrics }) {
  const t = useTranslations('metrics');
  return (
    <div className="hidden lg:flex items-center gap-3 text-xs font-mono text-muted">
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
          'w-28 sm:w-36 lg:w-56 ps-7 pe-2 py-1.5',
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
      className="flex items-center rounded-md border border-border overflow-hidden"
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
              'px-2 sm:px-2.5 py-1.5 text-xs font-medium uppercase tracking-wider transition-colors',
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
    getMetrics().then(setMetrics);
  }, []);

  return (
    <header className="flex-none bg-surface border-b border-border z-20">

      {/* ── Row 1 ─────────────────────────────────────────────────────── */}
      <div className="flex items-center px-4 gap-3 h-12">

        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <Leaf size={16} className="text-gold" />
          <span className="font-serif text-base sm:text-lg font-semibold text-ink tracking-widest uppercase leading-none">
            Caviendoo
          </span>
          <span className="hidden xl:block text-2xs text-muted tracking-widest uppercase ps-2 border-s border-border">
            Agricultural Intelligence
          </span>
        </div>

        {/* Overlay toggle — desktop/tablet */}
        <div className="hidden md:flex flex-1 justify-center">
          <OverlayToggle />
        </div>

        {/* Right-side controls */}
        <div className="flex items-center gap-2 ms-auto shrink-0">
          <MetricsBar metrics={metrics} />
          <div className="hidden lg:block w-px h-4 bg-border" />
          <SearchInput />
          <div className="w-px h-4 bg-border" />
          <LanguageSwitcher />
          {onAbout && (
            <>
              <div className="w-px h-4 bg-border" />
              <button
                onClick={onAbout}
                className="p-1.5 rounded text-muted hover:text-ink hover:bg-ink/5 transition-colors"
                aria-label="About Caviendoo"
                title="About Caviendoo"
              >
                <Info size={15} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Row 2: Overlay toggle — mobile only ──────────────────────── */}
      <div className="md:hidden border-t border-border/40 px-3 py-1.5">
        <OverlayToggle className="w-full" />
      </div>

    </header>
  );
}
