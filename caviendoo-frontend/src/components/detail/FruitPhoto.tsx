'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import type { Fruit } from '@/types';
import { ImageLightbox } from './ImageLightbox';

// 2-px category accent bar colours
const CATEGORY_ACCENT: Record<string, string> = {
  citrus:   'bg-amber-500',
  stone:    'bg-rose-600',
  pomme:    'bg-emerald-600',
  tropical: 'bg-purple-600',
  berry:    'bg-red-700',
  dried:    'bg-[#6b3f1a]',
  melon:    'bg-lime-600',
  other:    'bg-slate-500',
};

const SLIDE_INTERVAL_MS = 4000;

export function FruitPhoto({ fruit }: { fruit: Fruit }) {
  const slides = useMemo<string[]>(() => {
    const fromArray = (fruit.images ?? []).map((i) => i.url).filter(Boolean);
    if (fromArray.length > 0) return fromArray;
    return fruit.photoUrl ? [fruit.photoUrl] : [];
  }, [fruit.images, fruit.photoUrl]);

  const [index, setIndex]           = useState(0);
  const [isPaused, setIsPaused]     = useState(false);
  const [lightbox, setLightbox]     = useState(false);
  const containerRef                = useRef<HTMLDivElement>(null);

  // Reset index when fruit changes
  useEffect(() => {
    setIndex(0);
  }, [fruit.id]);

  // Auto-advance (paused on hover or when lightbox is open)
  useEffect(() => {
    if (slides.length < 2 || isPaused || lightbox) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(t);
  }, [slides.length, isPaused, lightbox]);

  if (slides.length === 0) return null;

  return (
    <>
      <div
        ref={containerRef}
        className="relative w-full bg-surface overflow-hidden shrink-0 cursor-zoom-in"
        style={{ height: 170 }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onClick={() => setLightbox(true)}
        role="button"
        tabIndex={0}
        aria-label="Expand photo"
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setLightbox(true); }}
      >
        {/* Slide stack — all images mounted, only active one is visible */}
        {slides.map((url, i) => (
          <div
            key={url + i}
            className="absolute inset-0 transition-opacity duration-700 ease-in-out"
            style={{ opacity: i === index ? 1 : 0 }}
            aria-hidden={i !== index}
          >
            <Image
              src={url}
              alt={fruit.name.en}
              fill
              className="object-cover"
              unoptimized
              priority={i === 0}
            />
          </div>
        ))}

        {/* Gradient overlay — bottom fade */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent pointer-events-none" />

        {/* Latin name — bottom-left */}
        <p className="absolute bottom-2 start-3 text-2xs text-white/80 font-mono italic leading-none pointer-events-none">
          {fruit.latinName}
        </p>

        {/* Dot indicators — bottom-right (only if more than 1 slide) */}
        {slides.length > 1 && (
          <div
            className="absolute bottom-2 end-3 flex gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show image ${i + 1}`}
                className={[
                  'w-1.5 h-1.5 rounded-full transition-all',
                  i === index
                    ? 'bg-white w-4'
                    : 'bg-white/50 hover:bg-white/80',
                ].join(' ')}
              />
            ))}
          </div>
        )}

        {/* Category colour bar */}
        <div className={`absolute bottom-0 inset-x-0 h-0.5 ${CATEGORY_ACCENT[fruit.category] ?? 'bg-slate-500'}`} />
      </div>

      {lightbox && (
        <ImageLightbox
          slides={slides}
          index={index}
          altBase={fruit.name.en}
          onClose={() => setLightbox(false)}
          onPrev={() => setIndex((i) => (i - 1 + slides.length) % slides.length)}
          onNext={() => setIndex((i) => (i + 1) % slides.length)}
        />
      )}
    </>
  );
}
