import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function EntryShell({ children, className }: { children: React.ReactNode; className?: string }) {
  const today = new Date()
    .toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
    .toUpperCase();

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <header className="px-5 md:px-12">
        <div className="flex items-center justify-between py-1 text-[11px]">
          <span className="label text-muted">THE PEER-TO-PEER SPORTS EXCHANGE</span>
          <span className="font-condensed text-[12px] font-semibold uppercase tracking-[0.02em] text-burgundy">
            NFL · {today}
          </span>
        </div>
        <div className="rule border-t" />
        <div className="flex items-center justify-between py-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-[18px] leading-none text-forest" aria-hidden>
              ★
            </span>
            <span className="font-serif text-[32px] leading-none">ALLSTAR</span>
          </Link>
          <span className="label hidden text-muted sm:block">INVITE ONLY · SEASON 2026</span>
        </div>
        <div className="border-b-2 border-ink" />
      </header>

      <main className={cn('mx-auto w-full max-w-6xl flex-1 px-5 py-10 md:px-12 md:py-14', className)}>{children}</main>

      <footer className="border-t-2 border-ink px-5 py-6 md:px-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="font-serif text-[18px]">ALLSTAR ★ THE SPORTS EXCHANGE</span>
          <span className="text-[11px] text-muted">Simulated funds only. No real wagering.</span>
          <span className="label text-muted">21+ · PLAY RESPONSIBLY</span>
        </div>
      </footer>
    </div>
  );
}
