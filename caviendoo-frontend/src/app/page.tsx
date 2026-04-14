'use client';

import { useState, useEffect } from 'react';
import { TopBar } from '@/components/TopBar';
import { TunisiaMap } from '@/components/map/TunisiaMap';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { FruitDetailPanel } from '@/components/detail/FruitDetailPanel';
import { ComparisonBar } from '@/components/comparison/ComparisonBar';
import { ComparisonPanel } from '@/components/comparison/ComparisonPanel';
import { MobileBottomBar } from '@/components/MobileBottomBar';
import { MobileSidebarDrawer } from '@/components/MobileSidebarDrawer';
import { AboutModal } from '@/components/AboutModal';
import { getMetrics } from '@/services/dataService';
import type { SiteMetrics } from '@/types';

export default function Home() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [metrics, setMetrics] = useState<SiteMetrics>({
    totalFruits: 73,
    totalGovernorates: 24,
    totalAOC: 0,
  });

  useEffect(() => {
    getMetrics().then(setMetrics);
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-canvas">
      {/* ── Top Bar ───────────────────────────────────────────────────── */}
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
          <TunisiaMap />
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

      {/* ── About modal (first-visit + persistent ℹ button) ─────────── */}
      <AboutModal
        open={aboutOpen || undefined}
        onClose={() => setAboutOpen(false)}
      />
    </div>
  );
}
