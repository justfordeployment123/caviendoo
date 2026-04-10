'use client';

import Image from 'next/image';
import { X } from 'lucide-react';
import { CategoryBadge } from '@/components/sidebar/CategoryBadge';
import type { Fruit, Locale } from '@/types';

// ── Props ──────────────────────────────────────────────────────────────────

interface ComparisonSlotProps {
  fruit: Fruit;
  locale: Locale;
  /** Called with the fruit id when the user clicks the remove (×) button. */
  onRemove: (id: string) => void;
}

// ── Component ──────────────────────────────────────────────────────────────

/**
 * Single fruit column header rendered inside <thead> of the comparison table.
 * Displays: photo thumbnail, localised name, Arabic local name, category badge,
 * and a remove button.
 */
export function ComparisonSlot({ fruit, locale, onRemove }: ComparisonSlotProps) {
  return (
    <th className="border-s border-border/30 px-2 py-3 align-top">
      <div className="flex flex-col items-center gap-1.5">
        {/* Square thumbnail */}
        <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-surface-raised shrink-0">
          <Image
            src={fruit.photoUrl}
            alt={fruit.name[locale]}
            fill
            className="object-cover"
            unoptimized
          />
        </div>

        {/* Name row + remove button */}
        <div className="w-full flex flex-col items-center gap-0.5">
          <div className="flex items-start justify-center gap-1 w-full">
            <p className="font-serif text-xs text-cream text-center leading-tight line-clamp-2 flex-1">
              {fruit.name[locale]}
            </p>
            <button
              onClick={() => onRemove(fruit.id)}
              className="shrink-0 text-muted hover:text-cream transition-colors mt-0.5"
              aria-label={`Remove ${fruit.name[locale]}`}
            >
              <X size={10} />
            </button>
          </div>

          {/* Arabic local name — always shown regardless of locale */}
          <p className="font-arabic text-2xs text-muted text-center leading-tight">
            {fruit.localName}
          </p>

          <CategoryBadge category={fruit.category} locale={locale} size="xs" />
        </div>
      </div>
    </th>
  );
}
