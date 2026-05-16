'use client';

import { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { TopBar } from '@/components/TopBar';
import { TunisiaMap } from '@/components/map/TunisiaMap';
import { WorldMap } from '@/components/map/WorldMap';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { FruitDetailPanel } from '@/components/detail/FruitDetailPanel';
import { ComparisonBar } from '@/components/comparison/ComparisonBar';
import { ComparisonPanel } from '@/components/comparison/ComparisonPanel';
import { MobileBottomBar } from '@/components/MobileBottomBar';
import { MobileSidebarDrawer } from '@/components/MobileSidebarDrawer';
import { AboutModal } from '@/components/AboutModal';
import { getMetrics } from '@/services/dataService';
import type { SiteMetrics } from '@/types';

type ViewMode = 'world' | 'atlas';

export default function Home() {
  const [viewMode, setViewMode]               = useState<ViewMode>('world');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [aboutOpen, setAboutOpen]             = useState(false);
  const [transitioning, setTransitioning]     = useState(false);
  const [mounted, setMounted]                 = useState(false);
  const [metrics, setMetrics] = useState<SiteMetrics>({
    totalFruits: 73,
    totalGovernorates: 24,
    totalAOC: 0,
  });

  useEffect(() => {
    const saved = localStorage.getItem('caviendoo_view_mode') as ViewMode;
    if (saved === 'atlas' || saved === 'world') {
      setViewMode(saved);
    }
    setMounted(true);
    getMetrics().then(setMetrics);
  }, []);

  const enterAtlas = () => {
    setTransitioning(true);
    setTimeout(() => {
      setViewMode('atlas');
      localStorage.setItem('caviendoo_view_mode', 'atlas');
      setTransitioning(false);
    }, 350);
  };

  const exitAtlas = () => {
    setTransitioning(true);
    setTimeout(() => {
      setViewMode('world');
      localStorage.setItem('caviendoo_view_mode', 'world');
      setTransitioning(false);
    }, 350);
  };

  // ── Render guard for hydration ────────────────────────────────────────────
  if (!mounted) {
    return <div className="h-screen w-screen bg-canvas" />;
  }

  // ── World view ────────────────────────────────────────────────────────────
  if (viewMode === 'world') {
    return (
      <div
        className={[
          'flex flex-col h-[100dvh] w-screen overflow-hidden bg-canvas',
          'transition-opacity duration-350',
          transitioning ? 'opacity-0' : 'opacity-100',
        ].join(' ')}
      >
        {/* Mini header */}
        <header className="flex-none flex items-center justify-between px-4 h-14 bg-surface border-b border-border z-20">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/caviendoo_logo.png" alt="Caviendoo" className="w-8 h-8 object-contain animate-spin-globe" />
            <span className="font-serif text-lg font-semibold text-cream tracking-widest uppercase">
              Caviendoo
            </span>
            <span className="hidden sm:block text-2xs text-muted tracking-widest uppercase ps-3 border-s border-border">
              Agricultural Intelligence
            </span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Globe size={14} className="text-gold shrink-0" />
            <span className="text-2xs sm:text-xs text-muted font-mono">Select a region</span>
          </div>
        </header>

        {/* World map — takes all remaining height */}
        <main className="flex-1 min-h-0 relative">
          <WorldMap
            onUnlockClick={enterAtlas}
            metrics={{ totalFruits: metrics.totalFruits, totalGovernorates: metrics.totalGovernorates }}
          />
        </main>
      </div>
    );
  }

  // ── Atlas view (existing layout) ──────────────────────────────────────────
  return (
    <div
      className={[
        'flex flex-col h-[100dvh] w-screen overflow-hidden bg-canvas',
        'transition-opacity duration-350',
        transitioning ? 'opacity-0' : 'opacity-100',
      ].join(' ')}
    >
      {/* ── Top Bar ────────────────────────────────────────────────────── */}
      <TopBar onAbout={() => setAboutOpen(true)} />

      {/* ── Main content row ──────────────────────────────────────────── */}
      <main className="flex flex-1 min-h-0 overflow-hidden relative">

        {/* Sidebar */}
        <aside
          id="sidebar"
          className="hidden md:flex md:w-72 shrink-0 flex-col parchment-bg border-e border-border-parchment overflow-hidden order-first rtl:order-last rtl:border-e-0 rtl:border-s rtl:border-border-parchment"
        >
          <Sidebar />
        </aside>

        {/* Map */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden order-2">
          <TunisiaMap onBack={exitAtlas} />
        </div>

        {/* Detail Panel */}
        <FruitDetailPanel />
      </main>

      {/* ── Mobile bottom bar ────────────────────────────────────────── */}
      <MobileBottomBar
        onOpenSidebar={() => setMobileSidebarOpen(true)}
        fruitCount={metrics.totalFruits}
      />

      {/* ── Mobile sidebar drawer ────────────────────────────────────── */}
      <MobileSidebarDrawer
        open={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {/* ── Comparison bar + panel ────────────────────────────────────── */}
      <ComparisonBar />
      <ComparisonPanel />

      {/* ── About modal ───────────────────────────────────────────────── */}
      <AboutModal
        open={aboutOpen || undefined}
        onClose={() => setAboutOpen(false)}
      />
    </div>
  );
}
