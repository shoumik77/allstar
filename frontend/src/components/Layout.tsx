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
      <header className="sticky top-0 z-10 border-b-4 border-ink bg-paper">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-4 py-3">
          <span className="font-pixel text-base uppercase tracking-tight">
            Pick<span className="text-varsity">Clash</span>
          </span>

          <nav className="flex flex-1 items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 border-2 border-transparent px-3 py-2 font-pixel text-[10px] uppercase text-ink-soft transition-colors hover:text-ink',
                    isActive && 'border-ink bg-paper-raised text-ink shadow-hard-sm',
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
              <div className="border-2 border-ink bg-paper-raised px-3 py-1.5 text-right shadow-hard-sm">
                <div className="font-pixel text-[10px] uppercase leading-tight">{me.user.username}</div>
                <div className="font-pixel text-[9px] leading-relaxed text-field">
                  {me.balance.available.toLocaleString()} PTS
                  {me.balance.locked > 0 && (
                    <span className="text-ink-faint"> · {me.balance.locked.toLocaleString()} LKD</span>
                  )}
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
