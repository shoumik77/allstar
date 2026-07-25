import { NavLink, Outlet } from 'react-router-dom';
import { CalendarDays, LayoutList, LogOut, Trophy, User } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navItems = [
  { to: '/feed', label: 'Feed', icon: LayoutList },
  { to: '/games', label: 'Games', icon: CalendarDays },
  { to: '/my-picks', label: 'My Picks', icon: User },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
];

export function Layout() {
  const { me, logout } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-surface-border bg-surface/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-4">
          <span className="text-lg font-bold tracking-tight">
            Pick<span className="text-brand">Clash</span>
          </span>

          <nav className="flex flex-1 items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-surface-raised hover:text-slate-100',
                    isActive && 'bg-surface-raised text-slate-100',
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>

          {me && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-medium leading-tight">{me.user.username}</div>
                <div className="text-xs text-slate-400">
                  {me.balance.available.toLocaleString()} pts
                  {me.balance.locked > 0 && ` · ${me.balance.locked.toLocaleString()} locked`}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={logout} aria-label="Log out">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
