'use client';

import { memo } from 'react';

export const HeritageBadge = memo(function HeritageBadge() {
  return (
    <span className="badge shrink-0 bg-[#6b3f1a] text-amber-200 text-2xs px-1.5 py-0">
      ♦
    </span>
  );
});
