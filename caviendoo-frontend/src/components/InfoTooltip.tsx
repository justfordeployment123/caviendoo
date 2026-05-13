'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Info, X } from 'lucide-react';

interface InfoTooltipProps {
  title: string;
  body: string;
  className?: string;
  iconSize?: number;
}

interface TooltipPos {
  top: number;
  left: number;
}

const TOOLTIP_W = 272;
const TOOLTIP_H = 110; // rough estimate for clamping

/**
 * Info icon that shows a fixed-position tooltip card using a React portal.
 * The tooltip is always fully visible — it auto-flips above/below and
 * clamps horizontally so it never leaves the viewport.
 */
export function InfoTooltip({ title, body, className = '', iconSize = 12 }: InfoTooltipProps) {
  const [open, setOpen]       = useState(false);
  const [pos, setPos]         = useState<TooltipPos>({ top: 0, left: 0 });
  const [openUpward, setOpenUpward] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef            = useRef<HTMLSpanElement>(null);

  // Ensure portal only renders client-side
  useEffect(() => { setMounted(true); }, []);

  const calcPos = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const vw   = window.innerWidth;
    const vh   = window.innerHeight;

    // Flip upward if not enough space below
    const spaceBelow = vh - rect.bottom - 8;
    const goUp = spaceBelow < TOOLTIP_H && rect.top > TOOLTIP_H;
    setOpenUpward(goUp);

    // Horizontal: centre on trigger, clamp within viewport
    let left = rect.left + rect.width / 2 - TOOLTIP_W / 2;
    left = Math.max(8, Math.min(vw - TOOLTIP_W - 8, left));

    // Vertical: below or above trigger
    const top = goUp
      ? rect.top - TOOLTIP_H - 6
      : rect.bottom + 6;

    setPos({ top, left });
  }, []);

  const show = useCallback(() => { calcPos(); setOpen(true); }, [calcPos]);
  const hide = useCallback(() => setOpen(false), []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const tooltip = open && mounted ? createPortal(
    <div
      role="tooltip"
      style={{ position: 'fixed', top: pos.top, left: pos.left, width: TOOLTIP_W, zIndex: 9999 }}
      className="rounded-xl border border-border bg-surface shadow-2xl px-4 py-3 pointer-events-none"
    >
      {/* Caret */}
      <div
        className={[
          'absolute left-1/2 -translate-x-1/2 border-[5px] border-transparent',
          openUpward
            ? 'top-full border-t-surface'
            : 'bottom-full border-b-surface',
        ].join(' ')}
      />
      <p className="text-xs font-semibold text-gold mb-1.5 leading-tight">{title}</p>
      <p className="text-xs text-cream/75 leading-relaxed">{body}</p>
    </div>,
    document.body,
  ) : null;

  return (
    <span ref={triggerRef} className={`relative inline-flex items-center ${className}`}>
      {/* Trigger — span so it nests safely inside <button> elements */}
      <span
        role="button"
        tabIndex={0}
        aria-label={`Learn more: ${title}`}
        aria-expanded={open}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        onClick={(e) => { e.stopPropagation(); open ? hide() : show(); }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open ? hide() : show(); }
        }}
        className={[
          'inline-flex items-center justify-center rounded-full cursor-pointer select-none',
          'text-ink/35 hover:text-gold transition-colors',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold',
        ].join(' ')}
      >
        <Info size={iconSize} />
      </span>
      {tooltip}
    </span>
  );
}

// ── Standalone info modal for mobile / when triggered from a button ──────────
// Used by the overlay mode toggle when screen is too narrow for tooltip.

interface InfoModalProps {
  title: string;
  body: string;
  onClose: () => void;
}

export function InfoModal({ title, body, onClose }: InfoModalProps) {
  return createPortal(
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-canvas/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm bg-surface border border-border rounded-2xl px-6 py-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 end-3 p-1 rounded text-muted hover:text-ink transition-colors"
          aria-label="Close"
        >
          <X size={14} />
        </button>
        <p className="text-sm font-semibold text-gold mb-2">{title}</p>
        <p className="text-sm text-cream/80 leading-relaxed">{body}</p>
      </div>
    </div>,
    document.body,
  );
}
