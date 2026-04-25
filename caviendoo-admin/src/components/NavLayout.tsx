import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useAuthStore } from '../store/auth';

const NAV_LINKS = [
  { to: '/dashboard',    label: 'Dashboard' },
  { to: '/fruits',       label: 'Fruits' },
  { to: '/governorates', label: 'Governorates' },
];

export default function NavLayout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { admin, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="px-5 py-4 border-b border-border flex items-center gap-3">
        <img
          src="/caviendoo_logo.png"
          alt="Caviendoo"
          className="w-9 h-9 object-contain shrink-0"
        />
        <div>
          <span className="font-display text-gold text-lg font-semibold tracking-wide leading-none">
            Caviendoo
          </span>
          <p className="text-muted text-xs mt-0.5">Admin Panel</p>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_LINKS.map(({ to, label }) => {
          const active = pathname === to || pathname.startsWith(to + '/');
          return (
            <Link
              key={to}
              to={to}
              className={`block px-3 py-2 rounded text-sm transition-colors ${
                active
                  ? 'bg-gold/15 text-gold font-semibold'
                  : 'text-muted hover:text-cream hover:bg-ink/5'
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-border">
        <p className="text-muted text-xs mb-2 truncate">{admin?.email}</p>
        <button
          onClick={handleLogout}
          className="w-full text-xs text-muted hover:text-cream text-left transition-colors"
        >
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-canvas">

      {/* ── Desktop sidebar ────────────────────────────────────────────── */}
      <aside className="hidden md:flex w-56 bg-surface border-r border-border flex-col shrink-0">
        {sidebarContent}
      </aside>

      {/* ── Mobile backdrop ────────────────────────────────────────────── */}
      <div
        className={`md:hidden fixed inset-0 z-40 bg-ink/30 backdrop-blur-sm transition-opacity duration-200 ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* ── Mobile sidebar drawer ──────────────────────────────────────── */}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r border-border flex flex-col transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* ── Main content column ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 h-14 border-b border-border bg-surface shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded text-muted hover:text-cream hover:bg-ink/5 transition-colors"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <img src="/caviendoo_logo_small.png" alt="Caviendoo" className="w-7 h-7 object-contain" />
          <span className="font-display text-gold text-base font-semibold tracking-wide">
            Caviendoo
          </span>
          <span className="ms-auto text-muted text-xs">Admin</span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

    </div>
  );
}
