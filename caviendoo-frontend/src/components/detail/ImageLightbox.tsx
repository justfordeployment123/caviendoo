'use client';

import { useEffect } from 'react';
import Image from 'next/image';

interface Props {
  slides: string[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  altBase: string;
}

export function ImageLightbox({ slides, index, onClose, onPrev, onNext, altBase }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape')     onClose();
      if (e.key === 'ArrowLeft')  onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose, onPrev, onNext]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      {/* Image container — click inside doesn't close */}
      <div
        className="relative max-w-[95vw] max-h-[90vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={slides[index]!}
          alt={`${altBase} ${index + 1}`}
          width={1200}
          height={800}
          className="object-contain max-h-[90vh] rounded-sm"
          unoptimized
        />

        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors text-lg leading-none"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Prev */}
        {slides.length > 1 && (
          <button
            type="button"
            onClick={onPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors text-xl"
            aria-label="Previous image"
          >
            ‹
          </button>
        )}

        {/* Next */}
        {slides.length > 1 && (
          <button
            type="button"
            onClick={onNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors text-xl"
            aria-label="Next image"
          >
            ›
          </button>
        )}

        {/* Dot indicators */}
        {slides.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {slides.map((_, i) => (
              <span
                key={i}
                className={[
                  'rounded-full transition-all',
                  i === index ? 'bg-white w-4 h-1.5' : 'bg-white/50 w-1.5 h-1.5',
                ].join(' ')}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
