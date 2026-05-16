'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Caviendoo error]', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen bg-canvas text-cream gap-6 px-6 text-center">
      <img src="/caviendoo_logo.png" alt="Caviendoo" className="w-14 h-14 object-contain opacity-60" />
      <div>
        <p className="font-mono text-red-400 text-sm tracking-widest uppercase mb-2">Error</p>
        <h1 className="font-serif text-3xl font-semibold mb-2">Something went wrong</h1>
        <p className="text-muted text-sm max-w-xs">
          An unexpected error occurred. Try refreshing the page.
        </p>
      </div>
      <button
        onClick={reset}
        className="px-5 py-2 bg-gold hover:bg-gold/80 text-white text-sm font-semibold rounded-lg transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
