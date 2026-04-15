'use client';

import { useEffect, useState, useCallback } from 'react';
import { X, Leaf, MapPin, Award } from 'lucide-react';
import Image from 'next/image';

const STORAGE_KEY = 'caviendoo_about_dismissed';

interface AboutModalProps {
  /** Controlled open state (e.g. from persistent About button) */
  open?: boolean;
  onClose?: () => void;
}

export function AboutModal({ open: controlledOpen, onClose }: AboutModalProps) {
  const [open, setOpen] = useState(false);
  const [dontShow, setDontShow] = useState(false);

  // First-visit auto-open
  useEffect(() => {
    if (controlledOpen !== undefined) return; // controlled externally
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY);
      if (!dismissed) setOpen(true);
    } catch {
      // localStorage unavailable (SSR/private browsing) — skip
    }
  }, [controlledOpen]);

  // Sync controlled open prop
  useEffect(() => {
    if (controlledOpen !== undefined) setOpen(controlledOpen);
  }, [controlledOpen]);

  const handleClose = useCallback(() => {
    if (dontShow) {
      try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* ignore */ }
    }
    setOpen(false);
    onClose?.();
  }, [dontShow, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-ink/20 backdrop-blur-sm animate-fade-in"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-md bg-canvas border border-border rounded-xl shadow-panel-dark overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border bg-surface">
          <div className="flex items-center gap-4">
            <Image src="/caviendoo_logo_small.png" alt="Caviendoo" width={48} height={48} className="object-contain shrink-0" priority />
            <div>
              <h2 className="font-serif text-xl font-semibold text-ink leading-tight">
                Caviendoo
              </h2>
              <p className="text-xs text-muted uppercase tracking-widest mt-0.5">
                Agricultural Intelligence Platform
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded text-muted hover:text-ink hover:bg-ink/5 transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 flex flex-col gap-4">
          <p className="text-sm text-ink-muted leading-relaxed">
            Caviendoo is an interactive geographic atlas of Tunisia&apos;s agricultural heritage,
            built to support sourcing, seasonal planning, and variety intelligence across
            the 24 governorates.
          </p>

          {/* Stats row */}
          <div className="flex gap-3">
            <StatCard icon={<Leaf size={14} />} value="73" label="Fruits catalogued" />
            <StatCard icon={<MapPin size={14} />} value="24" label="Governorates mapped" />
            <StatCard icon={<Award size={14} />} value="3" label="AOC designations" />
          </div>

          {/* Legend */}
          <div className="bg-surface rounded-lg px-4 py-3 flex flex-col gap-2">
            <p className="text-2xs text-muted uppercase tracking-widest font-medium mb-1">
              Badge Guide
            </p>
            <div className="flex items-start gap-2">
              <span className="badge bg-gold/15 border border-gold text-gold shrink-0 mt-0.5">
                AOC
              </span>
              <p className="text-xs text-ink-muted leading-snug">
                <strong className="text-ink">Appellation d&apos;Origine Contrôlée</strong> — legally
                protected designation guaranteeing geographic origin and certified quality standards.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="badge bg-amber-100 border border-amber-400 text-amber-700 shrink-0 mt-0.5">
                ♦
              </span>
              <p className="text-xs text-ink-muted leading-snug">
                <strong className="text-ink">Heritage Variety</strong> — traditional cultivar
                preserved by local Tunisian farming communities for generations.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-surface">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShow}
              onChange={(e) => setDontShow(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-border accent-gold"
            />
            <span className="text-xs text-muted">Don&apos;t show again</span>
          </label>
          <button
            onClick={handleClose}
            className="px-4 py-1.5 rounded-md bg-gold text-canvas text-xs font-medium hover:bg-gold-light transition-colors"
          >
            Explore
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="flex-1 flex flex-col items-center gap-1 bg-surface rounded-lg py-3 border border-border">
      <span className="text-gold">{icon}</span>
      <span className="font-serif text-xl font-semibold text-ink tabular-nums">{value}</span>
      <span className="text-2xs text-muted text-center leading-tight">{label}</span>
    </div>
  );
}
