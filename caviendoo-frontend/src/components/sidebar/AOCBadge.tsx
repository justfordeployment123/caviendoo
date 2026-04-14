'use client';

import { memo } from 'react';

export const AOCBadge = memo(function AOCBadge() {
  return (
    <span
      className="badge shrink-0 bg-gold/15 border border-gold text-gold text-2xs px-1.5 py-0"
      title="Appellation d'Origine Contrôlée — protected designation of origin"
    >
      AOC
    </span>
  );
});
