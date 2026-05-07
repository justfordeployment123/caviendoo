'use client';

import { useState, useEffect, useRef } from 'react';
import { TriangleAlert, X } from 'lucide-react';

interface AlertBadgeProps {
  x: number;
  y: number;
  name: string;
  uvPeak: number;
}

export function AlertBadge({ x, y, name, uvPeak }: AlertBadgeProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  return (
    <div ref={ref} className="absolute z-20" style={{ left: x - 6, top: y - 6 }}>
      {/* Subtle amber dot indicator */}
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className="w-3 h-3 rounded-full bg-amber-400/80 border border-amber-200/70 flex items-center justify-center hover:bg-amber-400 transition-colors shadow-sm"
        aria-label={`UV alert — ${name}`}
      >
        <span className="block w-1.5 h-1.5 rounded-full bg-white/90" />
      </button>

      {/* Click popup */}
      {open && (
        <div
          className="absolute z-30 animate-fade-in"
          style={{ bottom: 18, left: '50%', transform: 'translateX(-50%)', width: 192 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-surface border border-border rounded-lg shadow-panel-dark overflow-hidden">
            <div className="flex items-center justify-between px-3 pt-2.5 pb-1.5 border-b border-border">
              <div className="flex items-center gap-1.5">
                <TriangleAlert size={12} className="text-amber-500 shrink-0" />
                <span className="text-xs font-semibold text-ink">UV Alert</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-muted hover:text-ink transition-colors p-0.5 rounded"
              >
                <X size={11} />
              </button>
            </div>
            <div className="px-3 py-2.5 space-y-1.5">
              <p className="text-xs font-semibold text-ink">{name}</p>
              <div className="flex items-center gap-2">
                <span className="text-2xs font-mono font-semibold text-amber-700 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded">
                  UV {uvPeak}
                </span>
                <span className="text-2xs text-muted">Very High</span>
              </div>
              <p className="text-2xs text-muted leading-relaxed">
                High UV stress during harvest. Consider shade management for sensitive crops.
              </p>
            </div>
          </div>
          <div
            className="absolute left-1/2 -translate-x-1/2 w-0 h-0"
            style={{
              bottom: -5,
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderTop: '5px solid #C8E08A',
            }}
          />
        </div>
      )}
    </div>
  );
}
