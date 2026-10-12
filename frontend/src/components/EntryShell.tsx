import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const tickerItems = [
  'No house',
  'No vig',
  '1,000 pts every Tuesday',
  'Call it. Fade it. Settle it.',
  'Moneyline & spread',
  'Odds locked at post',
  'Weekly leaderboard',
];

export function EntryShell({ children, className }: { children: React.ReactNode; className?: string }) {
  const ticker = [...tickerItems, ...tickerItems];

  return (
    <div className="stadium scanlines flex min-h-screen flex-col">
      <header className="border-b-4 border-ink bg-turf-deep/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="font-pixel text-xs uppercase tracking-tight text-chalk">
            All<span className="text-gold-bright">★</span>Star
          </Link>
          <div className="flex items-center gap-3 font-pixel text-[9px] uppercase text-chalk-soft">
            <span className="flex items-center gap-2 border-2 border-varsity bg-varsity/20 px-2 py-1 text-chalk">
              <span className="h-2 w-2 animate-pulse-dot bg-varsity" />
              Live
            </span>
            <span className="hidden sm:inline">Invite only · Season 2026 · 1,000 pts</span>
          </div>
        </div>
      </header>

      <div className="overflow-hidden border-b-4 border-ink bg-gold-bright py-1.5 text-ink">
        <div className="ticker-track font-pixel text-[9px] uppercase">
          {ticker.map((item, i) => (
            <span key={i} className="px-5">
              ▸ {item}
            </span>
          ))}
        </div>
      </div>

      <main className={cn('mx-auto w-full max-w-6xl flex-1 px-4 py-10 md:py-14', className)}>{children}</main>

      <footer className="border-t-4 border-ink bg-turf-deep/80">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3 font-pixel text-[9px] uppercase text-chalk-soft">
          <span>© 2026 All Star</span>
          <span className="text-gold-bright">
            Press start<span className="ml-1 inline-block animate-blink">▮</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
