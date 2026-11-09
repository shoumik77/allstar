import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { BookOpen, Layers, LayoutGrid, ListOrdered } from 'lucide-react';
import { useMatch } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useMe } from '@/lib/queries';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/markets', label: 'Markets' },
  { to: '/positions', label: 'My Positions' },
  { to: '/orders', label: 'Orders' },
  { to: '/activity', label: 'Activity' },
  { to: '/portfolio', label: 'Portfolio' },
];

const mobileNavItems = [
  { to: '/markets', label: 'Markets', icon: LayoutGrid },
  { to: '/positions', label: 'Positions', icon: Layers },
  { to: '/orders', label: 'Orders', icon: ListOrdered },
  { to: '/activity', label: 'Ledger', icon: BookOpen },
];

function Masthead({ compact }: { compact?: boolean }) {
  const { me, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [menuOpen]);

  const week = me?.week;
  const initials = (me?.user.username ?? '??').slice(0, 2).toUpperCase();
  const today = new Date()
    .toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
    .toUpperCase();

  return (
    <header>
      <div className="flex items-center justify-between py-1 text-[11px]">
        <span className="label text-muted">THE PEER-TO-PEER SPORTS EXCHANGE</span>
        <span className="font-condensed font-semibold text-[12px] uppercase tracking-[0.02em] text-burgundy">
          {week ? `NFL · WEEK ${week.nflWeekNumber} · ${today}` : `NFL · ${today}`}
        </span>
      </div>
      <div className="rule border-t" />
      <div className={cn('flex items-center justify-between gap-6', compact ? 'h-[76px]' : 'py-6')}>
        <div className="flex items-center gap-4">
          <span className={cn('leading-none text-forest', compact ? 'text-[28px]' : 'text-[40px]')} aria-hidden>
            ★
          </span>
          <h1 className={cn('font-serif leading-none', compact ? 'text-[49px]' : 'text-[80px]')}>ALLSTAR</h1>
          <div className="flex flex-col gap-[2px] pl-[10px] font-condensed text-[13px] font-semibold uppercase leading-none">
            <span>THE SPORTS</span>
            <span>EXCHANGE</span>
          </div>
        </div>
        <div className="flex items-center gap-6 pb-2">
          <div className="text-right">
            <p className="label text-muted">AVAILABLE TO TRADE</p>
            <p className="numeral text-[20px]">
              {me ? `${me.balance.available.toLocaleString()} pts` : '—'}
            </p>
          </div>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Account menu"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-parchment bg-parchment font-condensed text-[13px] font-semibold uppercase text-ink"
            >
              {initials}
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-12 z-20 w-40 border border-parchment bg-cream p-1 shadow-sm">
                <button
                  onClick={logout}
                  className="w-full px-3 py-2 text-left text-[13px] text-ink hover:bg-parchment"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function MobileMasthead() {
  const { me, logout } = useAuth();
  const initials = (me?.user.username ?? '??').slice(0, 2).toUpperCase();

  return (
    <header>
      <div className="flex items-center justify-between py-1 text-[11px]">
        <span className="label text-muted">THE PEER-TO-PEER SPORTS EXCHANGE</span>
        <span className="font-condensed font-semibold text-[12px] uppercase tracking-[0.02em] text-burgundy">
          {me?.week ? `NFL · WEEK ${me.week.nflWeekNumber}` : 'NFL'}
        </span>
      </div>
      <div className="rule border-t" />
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <span className="text-[20px] leading-none text-forest" aria-hidden>
            ★
          </span>
          <span className="font-serif text-[36px] leading-none">ALLSTAR</span>
        </div>
        <button onClick={logout} className="text-right" aria-label="Log out">
          <span className="block font-condensed text-[11px] uppercase tracking-[0.02em] text-muted">
            AVAILABLE · {initials}
          </span>
          <span className="numeral text-[14px]">
            {me ? `${me.balance.available.toLocaleString()} pts` : '—'}
          </span>
        </button>
      </div>
      <div className="rule border-t" />
    </header>
  );
}

function EditorialNav() {
  return (
    <nav className="flex h-[52px] items-center justify-between border-b-2 border-t border-ink">
      <div className="flex h-full items-center gap-8">
        {navItems.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex h-full items-center border-b-[3px] border-transparent text-[13px] transition-colors',
                isActive ? 'border-forest font-bold text-forest' : 'text-muted hover:text-ink',
              )
            }
          >
            {label}
          </NavLink>
        ))}
      </div>
      <span className="label text-muted">AMERICAN ODDS · POINTS · SIMULATION</span>
    </nav>
  );
}

function ExchangeFooter() {
  return (
    <footer className="mt-16 border-t-2 border-ink py-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <span className="font-serif text-[18px]">ALLSTAR ★ THE SPORTS EXCHANGE</span>
        <span className="text-[11px] text-muted">
          Illustrative schedule, records &amp; prices. Simulated funds only. No real wagering.
        </span>
        <span className="label text-muted">21+ · PLAY RESPONSIBLY</span>
      </div>
    </footer>
  );
}

function MobileNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ink bg-cream md:hidden">
      <div className="flex">
        {mobileNavItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-1 border-t-2 border-transparent py-2 text-[11px] font-condensed uppercase tracking-[0.02em]',
                isActive ? 'border-forest text-forest' : 'text-muted',
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export function ExchangeShell() {
  useMe();
  const isTerminal = Boolean(useMatch('/markets/:gameId'));

  return (
    <div className="min-h-screen">
      <div className="hidden px-5 md:block md:px-12">
        <Masthead compact={isTerminal} />
        <EditorialNav />
      </div>
      <div className="px-5 md:hidden">
        <MobileMasthead />
      </div>
      <main className={cn('px-5 pb-24 md:pb-0', isTerminal ? 'bg-ink text-cream md:px-8' : 'md:px-12')}>
        <Outlet />
      </main>
      <div className="hidden px-5 md:block md:px-12">
        <ExchangeFooter />
      </div>
      <MobileNav />
    </div>
  );
}
