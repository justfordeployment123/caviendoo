import { useEffect } from 'react';
import { X } from 'lucide-react';

interface Props {
  src:      string;
  alt?:     string;
  onClose:  () => void;
}

export default function ImageLightbox({ src, alt = '', onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 cursor-zoom-out"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 p-2 rounded-full bg-canvas/80 border border-border text-cream hover:border-gold hover:text-gold transition-colors"
      >
        <X size={20} />
      </button>

      <img
        src={src}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        className="max-w-[95vw] max-h-[90vh] object-contain rounded-lg shadow-2xl cursor-default"
      />
    </div>
  );
}
