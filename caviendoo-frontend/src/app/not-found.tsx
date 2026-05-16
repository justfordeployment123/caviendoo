import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen bg-canvas text-cream gap-6 px-6 text-center">
      <img src="/caviendoo_logo.png" alt="Caviendoo" className="w-14 h-14 object-contain opacity-60" />
      <div>
        <p className="font-mono text-gold text-sm tracking-widest uppercase mb-2">404</p>
        <h1 className="font-serif text-3xl font-semibold mb-2">Page not found</h1>
        <p className="text-muted text-sm max-w-xs">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>
      <Link
        href="/"
        className="px-5 py-2 bg-gold hover:bg-gold/80 text-white text-sm font-semibold rounded-lg transition-colors"
      >
        Back to Atlas
      </Link>
    </div>
  );
}
