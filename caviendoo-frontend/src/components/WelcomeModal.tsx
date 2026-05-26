'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';

interface WelcomeModalProps {
  onClose: () => void;
}

export function WelcomeModal({ onClose }: WelcomeModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div className="relative bg-surface border border-border rounded-2xl shadow-2xl px-10 py-10 flex flex-col items-center gap-5 max-w-sm w-full mx-4">

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-muted hover:text-cream hover:bg-ink/10 transition-colors"
        >
          <X size={16} />
        </button>

        {/* Spinning logo — spins once then stops */}
        <Image
          src="/caviendoo_logo.png"
          alt="Caviendoo"
          width={120}
          height={120}
          className="object-contain animate-spin-once"
          priority
        />

        {/* Title */}
        <div className="text-center">
          <h2 className="font-serif text-cream text-2xl font-semibold tracking-widest uppercase">
            Caviendoo
          </h2>
          <p className="text-muted text-xs tracking-widest uppercase mt-1">
            Agricultural Intelligence
          </p>
        </div>

        {/* Subtitle */}
        <p className="text-center text-sm text-muted leading-relaxed">
          Explore Tunisia&apos;s fruit heritage — harvests, water stress, and UV data across 24 governorates.
        </p>

        {/* CTA */}
        <button
          onClick={onClose}
          className="mt-1 px-6 py-2 rounded-full bg-gold text-ink text-sm font-semibold hover:bg-gold/90 transition-colors"
        >
          Explore the Atlas
        </button>
      </div>
    </div>
  );
}
