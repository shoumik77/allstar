import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { formatAmerican, formatKickoff, formatSpread } from '@/lib/format';
import { bookTotals } from '@/lib/book';
import { teamFor } from '@/lib/teams';
import type { Game, GamePick } from '@/lib/types';
import { StatusDot } from '@/components/ui/status-dot';
import { TeamMark } from './TeamMark';

function kickoffET(iso: string): string {
  return new Date(iso)
    .toLocaleString('en-US', {
      timeZone: 'America/New_York',
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit',
    })
    .toUpperCase()
    .replace(',', '');
}

function statusFor(game: Game): { state: 'pregame' | 'live' | 'final'; label: string } {
  if (game.status === 'FINAL') return { state: 'final', label: 'FINAL' };
  if (game.status === 'IN_PROGRESS' || (game.status === 'SCHEDULED' && new Date(game.kickoff) <= new Date()))
    return { state: 'live', label: 'LIVE' };
  return { state: 'pregame', label: `PREGAME · ${kickoffET(game.kickoff)} ET` };
}

function TeamBlock({ name, role }: { name: string; role: 'AWAY' | 'HOME' }) {
  const team = teamFor(name);
  return (
    <div className="flex min-w-0 items-center gap-3 md:gap-4">
      <TeamMark team={name} size={56} onDark className="max-md:hidden" />
      <TeamMark team={name} size={42} onDark className="md:hidden" />
      <div className="min-w-0">
        <p className="truncate font-condensed text-[16px] font-semibold uppercase tracking-[0.02em] text-parchment">
          {team.city}
        </p>
        <p className="truncate font-serif text-[26px] leading-none text-cream md:text-[38px]">{team.nickname}</p>
        <p className="mt-1 font-condensed text-[12px] uppercase tracking-[0.02em] text-parchment/70">{role}</p>
      </div>
    </div>
  );
}

export function Scoreboard({ game, pick, allPicks }: { game: Game; pick: GamePick | null; allPicks: GamePick[] }) {
  const queryClient = useQueryClient();
  const status = statusFor(game);
  const away = teamFor(game.awayTeam);
  const home = teamFor(game.homeTeam);

  const totals = allPicks.reduce(
    (acc, p) => ({
      matched: acc.matched + (p.book?.totalMatched ?? p.matches.reduce((s, m) => s + m.withStake, 0)),
      liquidity: acc.liquidity + (p.book ? p.book.withAvailable + p.book.againstAvailable : bookTotals(p.orders).withAvailable + bookTotals(p.orders).againstAvailable),
    }),
    { matched: 0, liquidity: 0 },
  );

  const marketLabel = pick ? (pick.type === 'MONEYLINE' ? 'MONEYLINE' : `SPREAD ${formatSpread(pick.line)}`) : 'NO MARKET';
  const sideTeam = pick ? (pick.side === 'HOME' ? home : away) : null;
  const fadeTeam = pick ? (pick.side === 'HOME' ? away : home) : null;

  const simulate = async () => {
    await api(`/admin/games/${game.id}/simulate`, { method: 'POST', body: '{}' });
    for (const key of ['games', 'picks', 'pick', 'me', 'my-orders', 'transactions']) {
      void queryClient.invalidateQueries({ queryKey: [key] });
    }
  };

  return (
    <section className="bg-forest p-6">
      <div className="flex items-center justify-between">
        <p className="font-condensed text-[13px] font-semibold uppercase tracking-[0.02em] text-parchment">
          {game.week ? `WEEK ${game.week.nflWeekNumber} · ` : ''}
          {marketLabel}
        </p>
        <StatusDot state={status.state} label={status.label} />
      </div>

      {/* desktop team row */}
      <div className="mt-5 hidden items-center justify-between gap-5 md:flex">
        <TeamBlock name={game.awayTeam} role="AWAY" />
        <div className="flex flex-col items-center gap-2">
          <p className="numeral text-[28px] leading-none text-cream md:text-[36px]">
            {game.homeScore !== null && game.awayScore !== null
              ? `${game.awayScore} : ${game.homeScore}`
              : '— : —'}
          </p>
          <p className="font-condensed text-[11px] uppercase tracking-[0.02em] text-parchment/70">
            {formatKickoff(game.kickoff)}
          </p>
          {import.meta.env.DEV && game.status !== 'FINAL' && (
            <button
              onClick={() => void simulate()}
              className="mt-1 border border-forest-rule px-2 py-1 font-condensed text-[11px] uppercase text-parchment hover:bg-forest-rule"
            >
              Simulate
            </button>
          )}
        </div>
        <TeamBlock name={game.homeTeam} role="HOME" />
      </div>

      {/* mobile team row (per mobile-trading frame): abbrevs, gold kickoff, home city */}
      <div className="mt-5 flex items-center justify-between gap-3 md:hidden">
        <div className="flex items-center gap-3">
          <TeamMark team={game.awayTeam} size={42} onDark />
          <div>
            <p className="font-mono text-[32px] leading-none text-cream">{away.abbrev}</p>
            <p className="mt-1 font-condensed text-[13px] uppercase tracking-[0.02em] text-parchment/70">AWAY</p>
          </div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="numeral text-[26px] leading-none text-cream">
            {game.homeScore !== null && game.awayScore !== null
              ? `${game.awayScore} : ${game.homeScore}`
              : '— : —'}
          </p>
          <p className="font-condensed text-[13px] uppercase tracking-[0.02em] text-gold">
            {kickoffET(game.kickoff)} ET
          </p>
          <p className="text-[10px] text-parchment/70">{home.city.toUpperCase()}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <p className="font-mono text-[32px] leading-none text-cream">{home.abbrev}</p>
            <p className="mt-1 font-condensed text-[13px] uppercase tracking-[0.02em] text-parchment/70">HOME</p>
          </div>
          <TeamMark team={game.homeTeam} size={42} onDark />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-forest-rule pt-4">
        <div className="flex gap-6">
          {pick && sideTeam && fadeTeam && (
            <p className="font-condensed text-[13px] uppercase tracking-[0.02em] text-parchment">
              {away.abbrev} {formatAmerican(pick.side === 'AWAY' ? pick.sideOdds : pick.fadeOdds)} / {home.abbrev}{' '}
              {formatAmerican(pick.side === 'HOME' ? pick.sideOdds : pick.fadeOdds)}
            </p>
          )}
        </div>
        <p className="font-condensed text-[13px] uppercase tracking-[0.02em] text-parchment">
          {totals.matched.toLocaleString()} MATCHED · {totals.liquidity.toLocaleString()} LIQUIDITY
        </p>
      </div>
    </section>
  );
}
