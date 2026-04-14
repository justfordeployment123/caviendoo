'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Search, Loader2 } from 'lucide-react';
import { useAtlasStore } from '@/store';
import { searchFruits } from '@/services/dataService';
import { CategoryBadge } from './sidebar/CategoryBadge';
import type { Fruit, Locale } from '@/types';

// ── Text highlight helper ─────────────────────────────────────────────────

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;

  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;

  return (
    <>
      {text.slice(0, idx)}
      <strong className="font-semibold text-gold">{text.slice(idx, idx + query.length)}</strong>
      {text.slice(idx + query.length)}
    </>
  );
}

// ── Single result row ─────────────────────────────────────────────────────

function ResultRow({
  fruit,
  locale,
  query,
  isActive,
  onSelect,
  rowRef,
}: {
  fruit: Fruit;
  locale: Locale;
  query: string;
  isActive: boolean;
  onSelect: (id: string) => void;
  rowRef?: React.Ref<HTMLButtonElement>;
}) {
  return (
    <button
      ref={rowRef}
      role="option"
      aria-selected={isActive}
      onClick={() => onSelect(fruit.id)}
      className={[
        'w-full flex items-center gap-2.5 px-3 py-2 text-start transition-colors',
        isActive ? 'bg-surface-raised' : 'hover:bg-surface-raised',
      ].join(' ')}
    >
      {/* Thumbnail */}
      <div className="relative shrink-0 w-9 h-9 rounded overflow-hidden bg-surface">
        <Image
          src={fruit.thumbnailUrl}
          alt={fruit.name.en}
          width={36}
          height={36}
          className="object-cover w-full h-full"
          unoptimized
        />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1.5">
          <span className="text-sm text-ink truncate">
            <Highlight text={fruit.name[locale]} query={query} />
          </span>
          <CategoryBadge category={fruit.category} locale={locale} size="xs" />
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="font-arabic text-xs text-muted truncate">{fruit.localName}</span>
          {fruit.primaryGovernorate && (
            <span className="text-2xs text-muted/70 shrink-0">· {fruit.primaryGovernorate}</span>
          )}
        </div>
      </div>
    </button>
  );
}

// ── Main dropdown ─────────────────────────────────────────────────────────

interface SearchDropdownProps {
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export function SearchDropdown({ inputRef }: SearchDropdownProps) {
  const t = useTranslations('search');

  const locale = useAtlasStore((s) => s.locale);
  const searchQuery = useAtlasStore((s) => s.searchQuery);
  const setSearchQuery = useAtlasStore((s) => s.setSearchQuery);
  const isSearchOpen = useAtlasStore((s) => s.isSearchOpen);
  const setIsSearchOpen = useAtlasStore((s) => s.setIsSearchOpen);
  const setSelectedFruitId = useAtlasStore((s) => s.setSelectedFruitId);

  const [results, setResults] = useState<Fruit[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // ── Debounced search ────────────────────────────────────────────────────
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      const found = await searchFruits(searchQuery, locale);
      setResults(found);
      setActiveIndex(-1);
      setLoading(false);
    }, 150);
    return () => clearTimeout(timer);
  }, [searchQuery, locale]);

  // Reset index when query changes
  useEffect(() => {
    setActiveIndex(-1);
  }, [searchQuery]);

  // ── Select a fruit ──────────────────────────────────────────────────────
  const handleSelect = useCallback(
    (id: string) => {
      setSelectedFruitId(id);
      setIsSearchOpen(false);
      setSearchQuery('');
      if (inputRef.current) inputRef.current.value = '';
    },
    [setSelectedFruitId, setIsSearchOpen, setSearchQuery, inputRef]
  );

  // ── Keyboard navigation ─────────────────────────────────────────────────
  useEffect(() => {
    if (!isSearchOpen) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, -1));
      } else if (e.key === 'Enter') {
        if (activeIndex >= 0 && results[activeIndex]) {
          e.preventDefault();
          handleSelect(results[activeIndex].id);
        }
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        inputRef.current?.blur();
      }
    }

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isSearchOpen, activeIndex, results, handleSelect, setIsSearchOpen, inputRef]);

  // Scroll active row into view
  useEffect(() => {
    if (activeIndex >= 0 && rowRefs.current[activeIndex]) {
      rowRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  // ── Click outside to close ──────────────────────────────────────────────
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setIsSearchOpen, inputRef]);

  const isVisible = isSearchOpen && (loading || searchQuery.trim().length > 0);

  if (!isVisible) return null;

  return (
    <div
      ref={dropdownRef}
      role="listbox"
      aria-label="Search results"
      className={[
        'absolute top-full mt-1 end-0 ltr:w-80 rtl:w-80 rtl:start-0',
        'bg-surface border border-border rounded-sm shadow-2xl z-50',
        'overflow-hidden',
      ].join(' ')}
    >
      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-4 text-muted">
          <Loader2 size={14} className="animate-spin" />
          <span className="text-xs">Searching…</span>
        </div>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <div className="max-h-[360px] overflow-y-auto scrollbar-dark divide-y divide-border/40">
          {results.map((fruit, i) => (
            <ResultRow
              key={fruit.id}
              fruit={fruit}
              locale={locale}
              query={searchQuery}
              isActive={activeIndex === i}
              onSelect={handleSelect}
              rowRef={(el) => { rowRefs.current[i] = el; }}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && searchQuery.trim().length > 0 && results.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-6 px-4 text-center">
          <Search size={18} className="text-muted opacity-50" />
          <p className="text-sm text-muted">
            {t('noResults', { query: searchQuery })}
          </p>
          <p className="text-xs text-muted/60">{t('hint')}</p>
        </div>
      )}

      {/* Result count footer */}
      {!loading && results.length > 0 && (
        <div className="px-3 py-1.5 border-t border-border/40 bg-surface/80">
          <span className="text-2xs text-muted">
            {results.length === 1
              ? t('resultCount', { count: results.length })
              : t('resultCountPlural', { count: results.length })}
            {' · '}
            {t('keyboardHint')}
          </span>
        </div>
      )}
    </div>
  );
}
