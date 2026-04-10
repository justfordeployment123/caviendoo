'use client';

import { AlertTriangle } from 'lucide-react';

interface AlertBadgeProps {
  x: number;
  y: number;
  label?: string;
}

/**
 * Rendered as an SVG foreignObject over a governorate centroid.
 * Shown when governorate.uvPeak >= 8 (high UV stress threshold).
 */
export function AlertBadge({ x, y, label }: AlertBadgeProps) {
  return (
    <foreignObject x={x - 10} y={y - 10} width={22} height={22} className="pointer-events-none">
      <div
        title={label ?? 'High UV'}
        className="w-[22px] h-[22px] flex items-center justify-center rounded-full bg-[#c04010]/80 border border-[#e08020]/60"
      >
        <AlertTriangle size={11} className="text-[#fde68a]" strokeWidth={2.5} />
      </div>
    </foreignObject>
  );
}
