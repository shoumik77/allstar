import { Link } from 'react-router-dom';
import { formatAmerican, formatSpread } from '@/lib/format';
import { teamFor } from '@/lib/teams';
import type { Game, GamePick } from '@/lib/types';
import { StatusDot } from '@/components/ui/status-dot';
import { cn } from '@/lib/utils';

export function kickoffLabelET(iso: string): string {
  return new Date(iso)
    .toLocaleString('en-US', {
      timeZone: 'America/New_York',
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit',
    })
    .toUpperCase()
    .replace(/,/, '');
}

export function statusDotFor(game: Game): 'pregame' | 'live' | 'final' | 'void' {
  if (game.status === 'FINAL') return 'final';
  if (game.status === 'POSTPONED') return 'void';
  if (game.status === 'IN_PROGRESS' || new Date(game.kickoff) <= new Date()) return 'live';
  return 'pregame';
}

export type PriceChip = { text: string; empty: boolean };

/** Best WITH (max sideOdds across picks on T) and AGAINST (max fadeOdds against T). */
export function bestPricesFor(picks: GamePick[], teamIsHome: boolean, market?: string): { with: PriceChip; against: PriceChip } {
  const sidePicks = picks.filter(
    (p) => (p.side === 'HOME') === teamIsHome && (!market || p.type === market),
  );
  const fadePicks = picks.filter(
    (p) => (p.side === 'HOME') !== teamIsHome && (!market || p.type === market),
  );
  const chip = (list: GamePick[], field: 'sideOdds' | 'fadeOdds'): PriceChip => {
    if (list.length === 0) return { text: '—', empty: true };
    const best = list.reduce((a, b) => (b[field] > a[field] ? b : a));
    const line = best.type === 'SPREAD' && best.line !== null ? `${formatSpread(best.line)} · ` : '';
    return { text: `${line}${formatAmerican(best[field])}`, empty: false };
  };
  return { with: chip(sidePicks, 'sideOdds'), against: chip(fadePicks, 'fadeOdds') };
}

function Chip({ chip, side }: { chip: PriceChip; side: 'with' | 'against' }) {
  return (
    <span
      className={cn(
        'flex h-[38px] w-[62px] items-center justify-center font-mono text-[13px]',
        chip.empty
          ? 'text-muted'
          : side === 'with'
            ? 'bg-with-tint text-forest'
            : 'bg-against-tint text-burgundy',
      )}
    >
      {chip.text}
    </span>
  );
}

export function MatchupCard({
  game,
  picks,
  market,
  statusLabel,
}: {
  game: Game;
  picks: GamePick[];
  market?: 'MONEYLINE' | 'SPREAD';
  statusLabel?: string;
}) {
  const away = teamFor(game.awayTeam);
  const home = teamFor(game.homeTeam);
  const division = away.division === home.division && away.conference === home.conference
    ? `${away.conference} ${away.division.toUpperCase()}`
    : 'INTERCONFERENCE';
  const matched = picks.reduce((s, p) => s + (p.book?.totalMatched ?? 0), 0);
  const awayPrices = bestPricesFor(picks, false, market);
  const homePrices = bestPricesFor(picks, true, market);

  return (
    <Link to={`/markets/${game.id}`} className="block border border-parchment p-5 transition-colors hover:bg-parchment/40">
      <div className="flex items-center justify-between">
        <p className="label text-muted">{division}</p>
        <StatusDot state={statusDotFor(game)} label={statusLabel} />
      </div>
      <div className="mt-4 flex items-center justify-between">
        <p className="font-condensed text-[12px] uppercase tracking-[0.02em] text-muted">{kickoffLabelET(game.kickoff)} ET</p>
        <div className="flex gap-2 font-condensed text-[12px] uppercase">
          <span className="text-forest">WITH</span>
          <span className="text-burgundy">AGAINST</span>
        </div>
      </div>
      {[
        { team: away, role: 'AWAY', prices: awayPrices },
        { team: home, role: 'HOME', prices: homePrices },
      ].map(({ team, role, prices }) => (
        <div key={role} className="mt-3 flex items-center justify-between">
          <div>
            <p className="text-[14px] font-semibold">{team.city} {team.nickname}</p>
            <p className="font-condensed text-[12px] uppercase tracking-[0.02em] text-muted">{role}</p>
          </div>
          <div className="flex gap-2">
            <Chip chip={prices.with} side="with" />
            <Chip chip={prices.against} side="against" />
          </div>
        </div>
      ))}
      <div className="mt-4 flex items-center justify-between border-t border-parchment pt-3">
        <p className="font-mono text-[12px] text-muted">
          {matched.toLocaleString()} pts matched · {picks.length} {picks.length === 1 ? 'pick' : 'picks'}
        </p>
        <span className="text-[13px] font-semibold text-forest">View market ↗</span>
      </div>
    </Link>
  );
}
