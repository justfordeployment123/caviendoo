import { Link, useLocation, useNavigate } from 'react-router-dom';
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

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen flex bg-canvas">
      {/* Sidebar */}
      <aside className="w-56 bg-surface border-r border-border flex flex-col">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-border">
          <span className="font-display text-gold text-xl font-semibold tracking-wide">
            Caviendoo
          </span>
          <p className="text-muted text-xs mt-0.5">Admin Panel</p>
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
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
