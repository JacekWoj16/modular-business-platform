import { LogOut, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';

/** App header: title, current user, settings link, logout. */
export function TopBar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <header className="flex h-12 shrink-0 items-center justify-between bg-slate-900 px-4 text-slate-100">
      <span className="text-sm font-semibold tracking-wide">Modular Business App</span>
      <div className="flex items-center gap-3 text-sm">
        <span className="text-slate-300">{user?.username}</span>
        <Link to="/settings" className="rounded p-1 hover:bg-slate-800" aria-label="Settings" title="Settings">
          <Settings size={16} />
        </Link>
        <button onClick={logout} className="rounded p-1 hover:bg-slate-800" aria-label="Log out" title="Log out">
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
