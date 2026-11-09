import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useGames, usePicks } from '@/lib/queries';
import { teamFor } from '@/lib/teams';
import type { Game, GamePick } from '@/lib/types';
import { MarketSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Tabs } from '@/components/ui/tabs';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { StatusDot } from '@/components/ui/status-dot';
import { TeamMark } from '@/components/exchange/TeamMark';
import { WeekNav } from '@/components/exchange/WeekNav';
import { MatchupCard, bestPricesFor, statusDotFor } from '@/components/exchange/MatchupCard';

function editionLine(): string {
  const now = new Date();
  const weekday = now.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  const date = now.toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' }).toUpperCase();
  return `${weekday} EDITION / ${date}`;
}

function kickoffFullET(iso: string): string {
  return (
    new Date(iso)
      .toLocaleString('en-US', {
        timeZone: 'America/New_York',
        weekday: 'short',
        hour: 'numeric',
        minute: '2-digit',
      })
      .toUpperCase() + ' ET'
  );
}

function marqueeEyebrow(game: Game): string {
  const away = teamFor(game.awayTeam);
  const home = teamFor(game.homeTeam);
  if (away.conference === home.conference) {
    return away.division === home.division
      ? `${away.conference} ${away.division.toUpperCase()}`
      : `${away.conference} MATCHUP`;
  }
  return `${away.conference} VS ${home.conference}`;
}

function gameTotals(picks: GamePick[]) {
  return picks.reduce(
    (acc, p) => ({
      matched: acc.matched + (p.book?.totalMatched ?? 0),
      liquidity: acc.liquidity + (p.book?.withAvailable ?? 0) + (p.book?.againstAvailable ?? 0),
    }),
    { matched: 0, liquidity: 0 },
  );
}

function MarqueeMarket({ game, picks, index }: { game: Game; picks: GamePick[]; index: number }) {
  const away = teamFor(game.awayTeam);
  const home = teamFor(game.homeTeam);
  const { matched, liquidity } = gameTotals(picks);
  const awayWith = bestPricesFor(picks, false).with;
  const homeWith = bestPricesFor(picks, true).with;

  return (
    <section className="flex flex-col border-b border-t-2 border-ink md:flex-row">
      <div className="hidden py-7 pr-9 md:block md:w-[636px] md:shrink-0">
        <p className="label text-burgundy">THE MARQUEE MARKET · {marqueeEyebrow(game)}</p>
        <h2 className="mt-3 font-serif text-[44px] uppercase leading-[0.98] md:text-[69px]">
          {away.nickname} at {home.nickname}.
        </h2>
        <p className="mt-4 max-w-md text-[14px] leading-[1.7] text-muted">
          {away.city} heads to {home.city}. {picks.length} open {picks.length === 1 ? 'pick' : 'picks'}.{' '}
          {matched.toLocaleString()} pts matched. Set your price and trade directly with the other side.
        </p>
        <div className="mt-6 flex items-center gap-4">
          <Link to={`/markets/${game.id}`}>
            <Button variant="primary">Trade this game ↗</Button>
          </Link>
          <span className="font-mono text-[13px] text-muted">{matched.toLocaleString()} MATCHED</span>
        </div>
      </div>

      <div className="flex-1 bg-forest p-6 md:p-9">
        <div className="flex items-center justify-between">
          <p className="font-condensed text-[13px] uppercase tracking-[0.02em] text-gold md:text-parchment">
            <span className="md:hidden">THE MARQUEE MARKET</span>
            <span className="hidden md:inline">THIS WEEK'S GAME · NO. {String(index + 1).padStart(2, '0')}</span>
          </p>
          <StatusDot state={statusDotFor(game)} />
        </div>
        <h2 className="mt-3 font-serif text-[43px] leading-[0.98] text-cream md:hidden">
          {away.nickname} at {home.nickname}.
        </h2>
        <div className="mt-8 flex items-center justify-between">
          <div className="flex flex-col items-center gap-2">
            <TeamMark team={game.awayTeam} size={56} onDark className="md:hidden" />
            <TeamMark team={game.awayTeam} size={56} onDark className="hidden md:inline-flex" />
            <p className="font-mono text-[26px] leading-none text-cream md:text-[64px]">{away.abbrev}</p>
            <p className="font-condensed text-[13px] uppercase text-parchment/70">AWAY</p>
          </div>
          <p className="font-serif text-[26px] italic text-gold">at</p>
          <div className="flex flex-col items-center gap-2">
            <TeamMark team={game.homeTeam} size={56} onDark className="md:hidden" />
            <TeamMark team={game.homeTeam} size={56} onDark className="hidden md:inline-flex" />
            <p className="font-mono text-[26px] leading-none text-cream md:text-[64px]">{home.abbrev}</p>
            <p className="font-condensed text-[13px] uppercase text-parchment/70">HOME</p>
          </div>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3">
          {[
            [`${away.abbrev} WITH`, awayWith.text],
            [`${home.abbrev} WITH`, homeWith.text],
          ].map(([label, price]) => (
            <div key={label} className="border border-forest-rule p-4">
              <p className="font-condensed text-[13px] uppercase tracking-[0.02em] text-parchment">{label}</p>
              <p className="mt-1 font-mono text-[24px] text-cream md:text-[28px]">{price}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono text-[12px] text-parchment">{kickoffFullET(game.kickoff)}</p>
          <p className="font-mono text-[12px] text-parchment">
            {liquidity.toLocaleString()} pts available liquidity · American odds
          </p>
        </div>
        <Link to={`/markets/${game.id}`} className="mt-6 block md:hidden">
          <Button variant="gold" className="w-full">
            Trade this game →
          </Button>
        </Link>
      </div>
    </section>
  );
}

function LiveWire({ games }: { games: Game[] }) {
  const live = games.filter((g) => g.status === 'IN_PROGRESS');
  const finals = games.filter((g) => g.status === 'FINAL');
  if (live.length === 0 && finals.length === 0) return null;
  const items = [
    ...live.map((g) => `${teamFor(g.awayTeam).abbrev} ${g.awayScore ?? '—'} — ${teamFor(g.homeTeam).abbrev} ${g.homeScore ?? '—'} · LIVE`),
    ...finals.map((g) => `${teamFor(g.awayTeam).abbrev} ${g.awayScore ?? '—'} — ${teamFor(g.homeTeam).abbrev} ${g.homeScore ?? '—'} · FINAL · SETTLED`),
  ];
  return (
    <div className="flex items-center gap-4 overflow-x-auto whitespace-nowrap border-y border-parchment py-3">
      <StatusDot state="live" label="LIVE WIRE" />
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-4 font-mono text-[13px]">
          {i > 0 && <span className="h-4 w-px bg-parchment" />}
          {item}
        </span>
      ))}
      <span className="ml-auto font-condensed text-[12px] uppercase tracking-[0.02em] text-burgundy">
        ILLUSTRATIVE RESULTS
      </span>
    </div>
  );
}

export function MarketsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const weekParam = searchParams.get('week');
  const seasonParam = searchParams.get('season');
  const week = weekParam ? Number(weekParam) : undefined;
  const season = seasonParam ? Number(seasonParam) : undefined;

  const gamesQuery = useGames(week, season);
  const picksQuery = usePicks({ week, season });
  const [tab, setTab] = useState('upcoming');
  const [conference, setConference] = useState('ALL');
  const [market, setMarket] = useState<'ALL' | 'MONEYLINE' | 'SPREAD'>('ALL');
  const [expanded, setExpanded] = useState(false);

  const games = useMemo(
    () => [...(gamesQuery.data?.games ?? [])].sort((a, b) => a.kickoff.localeCompare(b.kickoff)),
    [gamesQuery.data],
  );
  const picksByGame = useMemo(() => {
    const map = new Map<string, GamePick[]>();
    for (const pick of picksQuery.data?.picks ?? []) {
      const list = map.get(pick.gameId) ?? [];
      list.push(pick);
      map.set(pick.gameId, list);
    }
    return map;
  }, [picksQuery.data]);

  const weekNumber = gamesQuery.data?.week.nflWeekNumber ?? week ?? 0;
  const marquee = useMemo(() => {
    let best: { game: Game; picks: GamePick[] } | null = null;
    for (const game of games) {
      const picks = picksByGame.get(game.id) ?? [];
      const matched = picks.reduce((s, p) => s + (p.book?.totalMatched ?? 0), 0);
      if (!best || matched > best.picks.reduce((s, p) => s + (p.book?.totalMatched ?? 0), 0)) {
        best = { game, picks };
      }
    }
    return best;
  }, [games, picksByGame]);

  const filtered = games.filter((game) => {
    if (tab === 'upcoming' && !(game.status === 'SCHEDULED' && new Date(game.kickoff) > new Date())) return false;
    if (tab === 'live' && !(game.status === 'IN_PROGRESS' || (game.status === 'SCHEDULED' && new Date(game.kickoff) <= new Date()))) return false;
    if (tab === 'final' && game.status !== 'FINAL' && game.status !== 'POSTPONED') return false;
    if (conference !== 'ALL' && teamFor(game.awayTeam).conference !== conference && teamFor(game.homeTeam).conference !== conference) return false;
    return true;
  });
  const counts = {
    upcoming: games.filter((g) => g.status === 'SCHEDULED' && new Date(g.kickoff) > new Date()).length,
    live: games.filter((g) => g.status === 'IN_PROGRESS' || (g.status === 'SCHEDULED' && new Date(g.kickoff) <= new Date())).length,
    final: games.filter((g) => g.status === 'FINAL' || g.status === 'POSTPONED').length,
  };
  const marketFilter = market === 'ALL' ? undefined : market;
  const visible = expanded ? filtered : filtered.slice(0, 4);
  const setWeek = (n: number) =>
    setSearchParams((p) => {
      p.set('week', String(n));
      return p;
    });

  const loading = gamesQuery.isLoading || picksQuery.isLoading;

  return (
    <div className="flex flex-col gap-7 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label text-muted">{editionLine()}</p>
          <h2 className="mt-1 font-serif text-[44px] leading-none md:text-[56px]">
            {gamesQuery.data?.week.status === 'CLOSED' ? 'The field is closed.' : 'The field is open.'}
          </h2>
        </div>
        <div className="hidden md:block">
          <WeekNav week={gamesQuery.data?.week} weekNumber={weekNumber} onChange={setWeek} />
        </div>
        <div className="md:hidden">
          <Select
            value={String(weekNumber)}
            onChange={(e) => setWeek(Number(e.target.value))}
            aria-label="Select week"
          >
            {Array.from({ length: 22 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                W{String(i + 1).padStart(2, '0')}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <MarketSkeleton />
          <MarketSkeleton />
          <MarketSkeleton />
        </div>
      ) : gamesQuery.isError ? (
        <ErrorState message="The slate could not be loaded." onRetry={() => void gamesQuery.refetch()} />
      ) : games.length === 0 ? (
        <EmptyState
          title="No games on the slate."
          body="Nothing has been synced for this week yet. Run the odds sync job or seed the dev database."
          action={{ label: 'Previous week', onClick: () => setWeek(Math.max(1, weekNumber - 1)) }}
        />
      ) : (
        <>
          {marquee && <MarqueeMarket game={marquee.game} picks={marquee.picks} index={games.indexOf(marquee.game)} />}

          <LiveWire games={games} />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Tabs
              items={[
                { id: 'upcoming', label: 'Upcoming', count: counts.upcoming },
                { id: 'live', label: 'Live', count: counts.live },
                { id: 'final', label: 'Final', count: counts.final },
              ]}
              value={tab}
              onChange={setTab}
            />
            <div className="flex gap-3">
              <Select value={conference} onChange={(e) => setConference(e.target.value)} className="w-44">
                <option value="ALL">ALL CONFERENCES</option>
                <option value="AFC">AFC</option>
                <option value="NFC">NFC</option>
              </Select>
              <Select value={market} onChange={(e) => setMarket(e.target.value as 'ALL' | 'MONEYLINE' | 'SPREAD')} className="w-36">
                <option value="ALL">ALL MARKETS</option>
                <option value="MONEYLINE">MONEYLINE</option>
                <option value="SPREAD">SPREAD</option>
              </Select>
            </div>
          </div>

          {visible.length === 0 ? (
            <EmptyState compact title="Nothing in this view." body="No games match these filters this week." />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {visible.map((game) => (
                <MatchupCard
                  key={game.id}
                  game={game}
                  picks={picksByGame.get(game.id) ?? []}
                  market={marketFilter}
                />
              ))}
            </div>
          )}
          {filtered.length > 4 && !expanded && (
            <div className="md:hidden">
              <Button variant="secondary" className="w-full" onClick={() => setExpanded(true)}>
                View all {filtered.length} upcoming games →
              </Button>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-parchment pt-4">
            <p className="label">YOUR PRICE. YOUR POSITION. YOUR GAME.</p>
            <p className="text-[12px] text-muted">
              Peer-to-peer matching · No house odds · Official-result settlement · Ties void
            </p>
          </div>
        </>
      )}
    </div>
  );
}
