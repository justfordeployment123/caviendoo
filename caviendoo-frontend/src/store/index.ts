import { create } from 'zustand';
import type {
  Locale,
  OverlayMode,
  FruitCategory,
  Fruit,
} from '@/types';

interface AppStore {
  // Language
  locale: Locale;
  setLocale: (locale: Locale) => void;

  // Map overlay
  overlayMode: OverlayMode;
  setOverlayMode: (mode: OverlayMode) => void;

  // Map selection
  selectedGovernorate: string | null;
  setSelectedGovernorate: (name: string | null) => void;
  hoveredGovernorate: string | null;
  setHoveredGovernorate: (name: string | null) => void;

  // Fruit selection
  selectedFruitId: string | null;
  setSelectedFruitId: (id: string | null) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchResults: Fruit[];
  setSearchResults: (results: Fruit[]) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;

  // Filters
  activeCategory: FruitCategory | null;
  setActiveCategory: (cat: FruitCategory | null) => void;
  filterAOC: boolean;
  setFilterAOC: (v: boolean) => void;
  filterHeritage: boolean;
  setFilterHeritage: (v: boolean) => void;

  // Comparison
  comparedFruitIds: string[];
  addToComparison: (id: string) => void;
  removeFromComparison: (id: string) => void;
  clearComparison: () => void;
  isComparisonOpen: boolean;
  setIsComparisonOpen: (open: boolean) => void;

  // Detail panel
  isDetailOpen: boolean;
  setIsDetailOpen: (open: boolean) => void;
}

export const useAtlasStore = create<AppStore>((set, get) => ({
  locale: 'en',
  setLocale: (locale) => set({ locale }),

  overlayMode: 'recoltes',
  setOverlayMode: (overlayMode) => set({ overlayMode }),

  selectedGovernorate: null,
  setSelectedGovernorate: (selectedGovernorate) =>
    set({ selectedGovernorate, isDetailOpen: selectedGovernorate ? false : get().isDetailOpen }),
  hoveredGovernorate: null,
  setHoveredGovernorate: (hoveredGovernorate) => set({ hoveredGovernorate }),

  selectedFruitId: null,
  setSelectedFruitId: (id) =>
    set({ selectedFruitId: id, isDetailOpen: id !== null }),

  searchQuery: '',
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  searchResults: [],
  setSearchResults: (searchResults) => set({ searchResults }),
  isSearchOpen: false,
  setIsSearchOpen: (isSearchOpen) => set({ isSearchOpen }),

  activeCategory: null,
  setActiveCategory: (activeCategory) => set({ activeCategory }),
  filterAOC: false,
  setFilterAOC: (filterAOC) => set({ filterAOC }),
  filterHeritage: false,
  setFilterHeritage: (filterHeritage) => set({ filterHeritage }),

  comparedFruitIds: [],
  addToComparison: (id) => {
    const current = get().comparedFruitIds;
    if (current.length < 3 && !current.includes(id)) {
      set({ comparedFruitIds: [...current, id] });
    }
  },
  removeFromComparison: (id) =>
    set({ comparedFruitIds: get().comparedFruitIds.filter((f) => f !== id) }),
  clearComparison: () => set({ comparedFruitIds: [], isComparisonOpen: false }),
  isComparisonOpen: false,
  setIsComparisonOpen: (isComparisonOpen) => set({ isComparisonOpen }),

  isDetailOpen: false,
  setIsDetailOpen: (isDetailOpen) => set({ isDetailOpen }),
}));
