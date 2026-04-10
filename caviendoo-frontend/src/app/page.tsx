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
import { getMetrics } from '@/services/dataService';
import type { SiteMetrics } from '@/types';

export default function Home() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
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
      <TopBar />

      {/* ── Main content row ──────────────────────────────────────────── */}
      <main className="flex flex-1 min-h-0 overflow-hidden relative">

        {/* Sidebar — start edge (left in LTR, right in RTL via order) */}
        <aside
          id="sidebar"
          className="hidden md:flex md:w-72 shrink-0 flex-col parchment-bg border-e border-border-parchment overflow-hidden order-first rtl:order-last rtl:border-e-0 rtl:border-s rtl:border-border-parchment"
        >
          <Sidebar />
        </aside>

        {/* Map — fills remaining space */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-canvas overflow-hidden order-2">
          <TunisiaMap />
        </div>

        {/* Detail Panel — end edge (right in LTR, left in RTL via order) */}
        <FruitDetailPanel />
      </main>

      {/* ── Mobile bottom bar (sm only) ──────────────────────────────── */}
      <MobileBottomBar
        onOpenSidebar={() => setMobileSidebarOpen(true)}
        fruitCount={metrics.totalFruits}
      />

      {/* ── Mobile sidebar drawer (sm only) ──────────────────────────── */}
      <MobileSidebarDrawer
        open={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {/* ── Comparison bar + panel ────────────────────────────────────── */}
      <ComparisonBar />
      <ComparisonPanel />
    </div>
  );
}
