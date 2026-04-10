'use client';

import { Leaf, SlidersHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAtlasStore } from '@/store';

interface MobileBottomBarProps {
  onOpenSidebar: () => void;
  fruitCount: number;
}

export function MobileBottomBar({ onOpenSidebar, fruitCount }: MobileBottomBarProps) {
  const t = useTranslations('nav');
  const activeCategory = useAtlasStore((s) => s.activeCategory);
  const filterAOC = useAtlasStore((s) => s.filterAOC);
  const filterHeritage = useAtlasStore((s) => s.filterHeritage);
  const selectedGovernorate = useAtlasStore((s) => s.selectedGovernorate);

  const activeFilters = [activeCategory, filterAOC, filterHeritage, selectedGovernorate].filter(Boolean).length;

  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-surface border-t border-border flex items-center px-4 py-2 gap-3 safe-area-bottom">
      <button
        onClick={onOpenSidebar}
        className="flex items-center gap-2 flex-1 py-2 px-3 rounded bg-surface-raised text-cream/80 hover:text-cream transition-colors"
      >
        <Leaf size={15} className="text-gold shrink-0" />
        <span className="text-sm font-medium">{t('fruits')}</span>
        {activeFilters > 0 && (
          <span className="ms-auto badge bg-gold text-canvas text-2xs">{activeFilters}</span>
        )}
        {activeFilters === 0 && (
          <span className="ms-auto text-2xs text-muted font-mono">{fruitCount}</span>
        )}
      </button>

      <div className="w-px h-6 bg-border shrink-0" />

      <button
        onClick={onOpenSidebar}
        className="p-2 text-muted hover:text-cream transition-colors"
        aria-label="Filters"
      >
        <SlidersHorizontal size={16} />
      </button>
    </div>
  );
}
