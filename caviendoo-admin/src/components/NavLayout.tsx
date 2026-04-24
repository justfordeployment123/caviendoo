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
      <aside className="w-56 bg-surface border-r border-white/10 flex flex-col">
        <div className="px-6 py-5 border-b border-white/10">
          <span className="font-display text-gold text-xl font-semibold tracking-wide">
            Caviendoo
          </span>
          <p className="text-cream/40 text-xs mt-0.5">Admin Panel</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_LINKS.map(({ to, label }) => {
            const active = pathname === to || pathname.startsWith(to + '/');
            return (
              <Link
                key={to}
                to={to}
                className={`block px-3 py-2 rounded text-sm transition-colors ${
                  active
                    ? 'bg-gold/20 text-gold font-medium'
                    : 'text-cream/60 hover:text-cream hover:bg-white/5'
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-white/10">
          <p className="text-cream/40 text-xs mb-2 truncate">{admin?.email}</p>
          <button
            onClick={handleLogout}
            className="w-full text-xs text-cream/40 hover:text-cream/80 text-left transition-colors"
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
