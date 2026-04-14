'use client';

import { memo } from 'react';

export const HeritageBadge = memo(function HeritageBadge() {
  return (
    <span
      className="badge shrink-0 bg-amber-100 border border-amber-400 text-amber-700 text-2xs px-1.5 py-0"
      title="Heritage Variety — traditional cultivar preserved by local communities"
    >
      ♦
    </span>
  );
});
