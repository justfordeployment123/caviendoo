'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { Sidebar } from './sidebar/Sidebar';

interface MobileSidebarDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function MobileSidebarDrawer({ open, onClose }: MobileSidebarDrawerProps) {
  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={[
          'md:hidden fixed inset-0 z-40 bg-canvas/70 backdrop-blur-sm transition-opacity duration-300',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer — slides up from bottom */}
      <div
        className={[
          'md:hidden fixed bottom-0 inset-x-0 z-50',
          'h-[75vh] flex flex-col rounded-t-xl overflow-hidden',
          'parchment-bg border-t border-border-parchment',
          'transition-transform duration-300 ease-out',
          open ? 'translate-y-0' : 'translate-y-full',
        ].join(' ')}
        role="dialog"
        aria-modal="true"
        aria-label="Fruit list"
      >
        {/* Handle bar */}
        <div className="shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-border-parchment">
          <div className="w-10 h-1 rounded-full bg-border-parchment mx-auto" />
          <button
            onClick={onClose}
            className="absolute end-4 p-1.5 text-ink-muted hover:text-ink transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Sidebar content */}
        <div className="flex-1 overflow-hidden">
          <Sidebar />
        </div>
      </div>
    </>
  );
}
