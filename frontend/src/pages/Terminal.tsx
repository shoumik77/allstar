import { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { bestLevel, bookTotals, buildLevels, lastTrade, remainingOf } from '@/lib/book';
import {
  formatAmerican,
  formatDateShort,
  formatPts,
  formatTimeET,
  signedPts,
} from '@/lib/format';
import { summarizePositions } from '@/lib/positions';
import { useCancelOrder, useGame, useMe, useMyOrders, usePick, usePicks, useTransactions } from '@/lib/queries';
import { teamFor } from '@/lib/teams';
import type { Game, GamePick, MyOrder, Transaction, TransactionType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { MarketSkeleton, Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusDot } from '@/components/ui/status-dot';
import { Tabs } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/toast';
import { Scoreboard } from '@/components/exchange/Scoreboard';
import { OrderBook } from '@/components/exchange/OrderBook';
import { PartialFillRow } from '@/components/exchange/PartialFillRow';
import { MarketTape } from '@/components/exchange/MarketTape';
import { OrderTicket } from '@/components/exchange/OrderTicket';
import { PickSelector } from '@/components/exchange/PickSelector';
import { NewPickSheet } from '@/components/exchange/NewPickSheet';

const EVENT_LABELS: Record<TransactionType, string> = {
  STAKE: 'Order reserved',
  REFUND: 'Stake returned',
  PAYOUT: 'Settlement payout',
  ORDER_CANCEL: 'Order cancelled',
  UNMATCHED_REFUND: 'Unmatched returned',
  WEEKLY_RESET: 'Weekly reset',
  SETTLEMENT_LOSS: 'Settlement loss',
};

const EVENT_EFFECT: Record<TransactionType, string> = {
  STAKE: 'Available only',
  REFUND: 'Available only',
  ORDER_CANCEL: 'Available only',
  UNMATCHED_REFUND: 'Available only',
  PAYOUT: 'Total capital',
  SETTLEMENT_LOSS: 'Total capital',
  WEEKLY_RESET: 'Total capital',
};

function pickActivity(pick: GamePick): number {
  return (pick.book?.totalMatched ?? 0) + (pick.book?.withAvailable ?? 0) + (pick.book?.againstAvailable ?? 0);
}

function IntelRow({ label, value, accent }: { label: string; value: string; accent?: 'mint' }) {
  return (
    <div className="flex items-center gap-3 border-b border-forest-rule py-2.5">
      <span className="flex-1 text-[12px] text-parchment">{label}</span>
      <span className={cn('font-mono text-[13px]', accent === 'mint' ? 'text-mint' : 'text-cream')}>{value}</span>
    </div>
  );
}

function GameIntelligence({
  game,
  pick,
  allPicks,
  positions,
}: {
  game: Game;
  pick: GamePick | null;
  allPicks: GamePick[];
  positions: ReturnType<typeof summarizePositions>;
}) {
  const away = teamFor(game.awayTeam);
  const home = teamFor(game.homeTeam);
  const sideTeam = pick ? (pick.side === 'HOME' ? home : away) : null;
  const totals = bookTotals(pick?.orders ?? []);
  const matched = pick?.matches.reduce((sum, m) => sum + m.withStake, 0) ?? 0;
  const last = pick ? lastTrade(pick.matches) : undefined;
  const high = pick && pick.matches.length ? Math.max(...pick.matches.map((m) => m.odds)) : null;
  const low = pick && pick.matches.length ? Math.min(...pick.matches.map((m) => m.odds)) : null;
  const bestWith = pick ? bestLevel(buildLevels(pick.orders, 'WITH')) : undefined;
  const bestAgainst = pick ? bestLevel(buildLevels(pick.orders, 'AGAINST')) : undefined;
  const position = positions[0];

  const exposureRows = position
    ? [
        ['Matched stake', formatPts(position.matchedStake)],
        ['Average price', position.matchedStake > 0 ? formatAmerican(position.avgOdds) : '—'],
        [
          position.side === 'WITH' ? `Profit if ${sideTeam?.abbrev} wins` : `Profit if ${sideTeam?.abbrev} loses`,
          signedPts(position.potentialProfit),
          'mint' as const,
        ],
        [
          position.side === 'WITH' ? `Loss if ${sideTeam?.abbrev} loses` : `Loss if ${sideTeam?.abbrev} wins`,
          formatPts(position.maxLoss),
        ],
        ['Unmatched reserve', formatPts(position.unmatched)],
      ]
    : [['Matched stake', '—']];

  return (
    <div className="flex flex-col gap-4">
      <p className="label text-parchment">GAME INTELLIGENCE</p>
      <h2 className="font-serif text-[24px] leading-[1.15] text-cream">
        {away.nickname} at {home.nickname}.
      </h2>
      <p className="text-[12px] leading-[1.6] text-parchment">
        {allPicks.length} open {allPicks.length === 1 ? 'pick' : 'picks'} · {matched.toLocaleString()} pts matched ·{' '}
        {allPicks.length ? 'Every price here comes from another trader.' : 'No picks yet. Create the first one.'}
      </p>

      <p className="label text-parchment">MARKET STATISTICS</p>
      <div>
        <IntelRow label="Matched" value={formatPts(matched)} />
        <IntelRow label="Liquidity" value={formatPts(totals.withAvailable + totals.againstAvailable)} />
        <IntelRow label={last ? `Last price · ${sideTeam?.abbrev}` : 'Last price'} value={last ? formatAmerican(last.odds) : '—'} />
        <IntelRow label="Session high" value={high !== null ? formatAmerican(high) : '—'} />
        <IntelRow label="Session low" value={low !== null ? formatAmerican(low) : '—'} />
      </div>

      {pick && sideTeam && (
        <>
          <p className="label text-parchment">CURRENT PRICING</p>
          <div>
            <IntelRow label={`${sideTeam.abbrev} · WITH`} value={formatAmerican(pick.sideOdds)} accent="mint" />
            <IntelRow label={`${sideTeam.abbrev} · AGAINST`} value={formatAmerican(pick.fadeOdds)} />
            <IntelRow label="Best WITH on book" value={bestWith ? formatAmerican(bestWith.odds) : '—'} accent="mint" />
            <IntelRow label="Best AGAINST on book" value={bestAgainst ? formatAmerican(bestAgainst.odds) : '—'} />
          </div>
          <p className="label text-parchment">YOUR {sideTeam.abbrev} EXPOSURE</p>
          <div>
            {exposureRows.map(([label, value, accent]) => (
              <IntelRow key={label as string} label={label as string} value={value as string} accent={accent as 'mint' | undefined} />
            ))}
          </div>
        </>
      )}

      <p className="text-[10px] leading-[1.6] text-parchment/60">
        Liquidity is all resting stake and liability on this pick. A push voids matched bets and refunds both sides.
      </p>
    </div>
  );
}

function DarkTable({ headers, rows, empty }: { headers: string[]; rows: React.ReactNode[][]; empty: string }) {
  if (rows.length === 0) {
    return <EmptyState compact tone="dark" title="Nothing here yet." body={empty} />;
  }
  return (
    <div className="w-full text-[12px]">
      <div className="flex h-10 items-center gap-3 border-b border-forest-rule font-condensed text-parchment">
        {headers.map((h, i) => (
          <span key={h} className={cn('flex-1', i === headers.length - 1 && 'text-right')}>
            {h}
          </span>
        ))}
      </div>
      {rows.map((cells, i) => (
        <div key={i} className="flex min-h-[58px] items-center gap-3 border-b border-forest-rule">
          {cells.map((cell, j) => (
            <div key={j} className={cn('flex-1', j === cells.length - 1 && 'text-right')}>
              {cell}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function TerminalTabs({
  gamePicks,
  myOrders,
  transactions,
  onCancel,
  cancelling,
}: {
  gamePicks: GamePick[];
  myOrders: MyOrder[];
  transactions: Transaction[];
  onCancel: (orderId: string) => void;
  cancelling: boolean;
}) {
  const [tab, setTab] = useState('open');
  const pickIds = new Set(gamePicks.map((p) => p.id));
  const orders = myOrders.filter((o) => pickIds.has(o.pickId));
  const open = orders.filter((o) => remainingOf(o) > 0);
  const positions = summarizePositions(orders);
  const activity = transactions.filter((t) => t.pickId && pickIds.has(t.pickId));

  const matchupFor = (order: MyOrder) => {
    const game = order.pick.game;
    const sideTeam = teamFor(order.pick.side === 'HOME' ? game.homeTeam : game.awayTeam);
    return `${teamFor(game.awayTeam).abbrev} @ ${teamFor(game.homeTeam).abbrev} / ${sideTeam.abbrev}`;
  };

  const items = [
    { id: 'open', label: 'Open orders', count: open.length },
    { id: 'positions', label: 'Positions', count: positions.length },
    { id: 'history', label: 'Order history', count: orders.length },
    { id: 'activity', label: 'Account activity', count: activity.length },
  ];

  return (
    <section className="border-t border-forest-rule px-6 py-5">
      <Tabs items={items} value={tab} onChange={setTab} className="border-forest-rule" />
      <div className="mt-5">
        {tab === 'open' && (
          <DarkTable
            headers={['MATCHUP / TEAM', 'SIDE', 'PRICE', 'STAKE', 'MATCHED', 'REMAINING', 'STATUS', '']}
            empty="No open orders on this game. The book above is waiting."
            rows={open.map((order) => [
              <span key="m" className="text-cream">{matchupFor(order)}</span>,
              <span key="s" className={order.side === 'WITH' ? 'text-mint' : 'text-rose'}>{order.side}</span>,
              <span key="p" className="font-mono text-cream">{formatAmerican(order.limitOdds)}</span>,
              <span key="r" className="font-mono text-cream">{order.risked.toLocaleString()}</span>,
              <span key="f" className="font-mono text-cream">{order.matched.toLocaleString()}</span>,
              <span key="re" className="font-mono text-cream">{remainingOf(order).toLocaleString()}</span>,
              <StatusDot key="st" state="partial" label={order.matched > 0 ? 'PARTIALLY MATCHED' : 'RESTING'} />,
              <button key="c" onClick={() => onCancel(order.id)} disabled={cancelling} className="text-rose hover:underline disabled:opacity-40">
                Cancel remainder
              </button>,
            ])}
          />
        )}
        {tab === 'positions' && (
          <DarkTable
            headers={['SIDE', 'AVG. PRICE', 'STAKE', 'MAX LOSS', 'POTENTIAL PROFIT', 'SETTLEMENT']}
            empty="No matched exposure on this game yet."
            rows={positions.map((pos) => [
              <span key="s" className={pos.side === 'WITH' ? 'text-mint' : 'text-rose'}>{pos.side}</span>,
              <span key="a" className="font-mono text-cream">{pos.matchedStake > 0 ? formatAmerican(pos.avgOdds) : '—'}</span>,
              <span key="t" className="font-mono text-cream">{pos.matchedStake.toLocaleString()}</span>,
              <span key="l" className="font-mono text-cream">{pos.maxLoss.toLocaleString()}</span>,
              <span key="p" className="font-mono text-mint">{signedPts(pos.potentialProfit)}</span>,
              <span key="r" className="text-parchment">
                {pos.status === 'PENDING' ? 'Awaiting result' : pos.status === 'WON' ? `Won ${signedPts(pos.realized)}` : pos.status === 'LOST' ? `Lost ${signedPts(pos.realized)}` : pos.status === 'PUSH' ? 'Push' : 'Mixed'}
              </span>,
            ])}
          />
        )}
        {tab === 'history' && (
          <DarkTable
            headers={['PLACED ET', 'MATCHUP / TEAM', 'SIDE', 'PRICE', 'STAKE', 'MATCHED', 'STATUS']}
            empty="No orders on this game yet."
            rows={orders.map((order) => [
              <span key="d" className="font-mono text-cream">{formatDateShort(order.createdAt)}</span>,
              <span key="m" className="text-cream">{matchupFor(order)}</span>,
              <span key="s" className={order.side === 'WITH' ? 'text-mint' : 'text-rose'}>{order.side}</span>,
              <span key="p" className="font-mono text-cream">{formatAmerican(order.limitOdds)}</span>,
              <span key="r" className="font-mono text-cream">{order.risked.toLocaleString()}</span>,
              <span key="f" className="font-mono text-cream">{order.matched.toLocaleString()}</span>,
              <span key="st" className="text-parchment">{order.status}</span>,
            ])}
          />
        )}
        {tab === 'activity' && (
          <DarkTable
            headers={['TIME ET', 'EVENT', 'AMOUNT', 'EFFECT']}
            empty="No ledger entries for this game yet."
            rows={activity.map((t) => [
              <span key="t" className="font-mono text-cream">{formatTimeET(t.createdAt)}</span>,
              <span key="e" className="text-cream">{EVENT_LABELS[t.type]}</span>,
              <span key="a" className={cn('font-mono', t.amount >= 0 ? 'text-mint' : 'text-rose')}>{signedPts(t.amount)}</span>,
              <span key="f" className="text-parchment">{EVENT_EFFECT[t.type]}</span>,
            ])}
          />
        )}
      </div>
    </section>
  );
}

export function TerminalPage() {
  const { gameId } = useParams<{ gameId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  const game = useGame(gameId);
  const picksQuery = usePicks(
    { gameId, week: game.data?.week?.nflWeekNumber, season: game.data?.week?.season },
    { enabled: Boolean(game.data?.week) },
  );

  const picks = picksQuery.data?.picks ?? [];
  const requestedPick = searchParams.get('pick');
  const defaultPick = useMemo(() => {
    if (requestedPick && picks.some((p) => p.id === requestedPick)) return requestedPick;
    return [...picks].sort((a, b) => pickActivity(b) - pickActivity(a))[0]?.id;
  }, [picks, requestedPick]);

  const pickQuery = usePick(defaultPick, { refetchInterval: 5000 });
  const pick = pickQuery.data ?? null;

  const me = useMe();
  const myOrders = useMyOrders('week');
  const transactions = useTransactions({ limit: 100 });
  const cancelOrder = useCancelOrder();
  const [sheetOpen, setSheetOpen] = useState(searchParams.get('new') === '1');

  const available = me.data?.balance.available ?? 0;

  const gamePickIds = useMemo(() => new Set(picks.map((p) => p.id)), [picks]);
  const myGameOrders = (myOrders.data?.orders ?? []).filter((o) => gamePickIds.has(o.pickId));
  const positions = useMemo(
    () => summarizePositions(myGameOrders.filter((o) => o.pickId === pick?.id)),
    [myGameOrders, pick?.id],
  );

  const handleCancel = (orderId: string) => {
    cancelOrder.mutate(orderId, {
      onSuccess: (res) => toast({ variant: 'success', title: `Remainder cancelled · ${res.refunded} pts returned` }),
      onError: (err) => toast({ variant: 'error', title: 'Cancel failed', body: err instanceof Error ? err.message : 'Try again.' }),
    });
  };

  if (game.isLoading || picksQuery.isLoading) {
    return (
      <div className="flex flex-col gap-6 py-6">
        <Skeleton className="h-6 w-72" />
        <Skeleton className="h-40 w-full" />
        <div className="grid gap-6 md:grid-cols-3">
          <MarketSkeleton />
          <MarketSkeleton />
          <MarketSkeleton />
        </div>
      </div>
    );
  }

  if (game.isError || !game.data) {
    return (
      <div className="py-10">
        <ErrorState message="This market could not be loaded." onRetry={() => void game.refetch()} />
      </div>
    );
  }

  const g = game.data;
  const away = teamFor(g.awayTeam);
  const home = teamFor(g.homeTeam);
  const sideTeam = pick ? (pick.side === 'HOME' ? home : away) : null;
  const last = pick ? lastTrade(pick.matches) : undefined;
  const bestWith = pick ? bestLevel(buildLevels(pick.orders, 'WITH')) : undefined;
  const bestAgainst = pick ? bestLevel(buildLevels(pick.orders, 'AGAINST')) : undefined;

  const pickLocked =
    !pick ||
    pick.status !== 'OPEN' ||
    g.status !== 'SCHEDULED' ||
    new Date(g.kickoff) <= new Date();
  const lockedReason = !pick
    ? 'No market selected.'
    : pick.status !== 'OPEN'
      ? 'This pick is no longer open.'
      : g.status === 'FINAL'
        ? 'This game is final.'
        : 'This pick locked at kickoff.';

  const openSheet = () => setSheetOpen(true);
  const selectPick = (id: string) => setSearchParams((p) => { p.set('pick', id); return p; });

  const viewerOpenOrders = pick ? pick.viewerOrders.filter((o) => remainingOf(o) > 0) : [];

  return (
    <div className="flex flex-col">
      {/* context row */}
      <div className="flex items-center justify-between border-b border-forest-rule py-3">
        <p className="font-condensed text-[13px] uppercase tracking-[0.02em] text-parchment">
          MARKETS / NFL / {away.abbrev} @ {home.abbrev}
        </p>
        <p className="hidden font-condensed text-[13px] font-semibold uppercase tracking-[0.02em] text-gold md:block">
          AMERICAN ODDS · SIMULATION · NO COMMISSION
        </p>
      </div>

      {/* mobile breadcrumb */}
      <div className="flex items-center justify-between py-3 md:hidden">
        <Link to="/markets" className="font-condensed text-[13px] uppercase tracking-[0.02em] text-parchment">
          ← WEEK {g.week?.nflWeekNumber} / {away.abbrev} @ {home.abbrev}
        </Link>
      </div>

      <Scoreboard game={g} pick={pick} allPicks={picks} />

      {/* workspace */}
      <div className="grid gap-6 pt-6 md:grid-cols-[208px_minmax(0,1fr)] xl:grid-cols-[208px_minmax(0,1fr)_248px]">
        <aside className="hidden md:block">
          <GameIntelligence game={g} pick={pick} allPicks={picks} positions={positions} />
        </aside>

        <div className="min-w-0 md:border-l md:border-forest-rule md:pl-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-condensed text-[13px] font-semibold uppercase tracking-[0.02em] text-parchment">
                {sideTeam ? `${sideTeam.city.toUpperCase()} ${sideTeam.nickname.toUpperCase()}` : 'NO MARKET'} · {pick?.type ?? ''}
              </p>
              <h2 className="font-serif text-[28px] leading-tight text-cream">The order book</h2>
            </div>
            <StatusDot state="live" label={`LIVE BOOK · ${formatTimeET(new Date(pickQuery.dataUpdatedAt || Date.now()).toISOString())} ET`} />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-y border-forest-rule py-3">
            <div className="flex items-center gap-3">
              {picks.length > 0 && <PickSelector picks={picks} value={pick?.id} onChange={selectPick} />}
              <button
                onClick={openSheet}
                className="h-9 border border-forest-rule px-3 text-[12px] font-semibold text-parchment transition-colors hover:bg-forest-rule"
              >
                New pick
              </button>
            </div>
            <p className="font-mono text-[12px] text-cream">
              LAST {last ? formatAmerican(last.odds) : '—'} · BEST {bestWith ? formatAmerican(bestWith.odds) : '—'}/{bestAgainst ? formatAmerican(bestAgainst.odds) : '—'}
            </p>
            <p className="font-condensed text-[13px] text-parchment">STAKE IN PTS</p>
          </div>

          <div className="mt-6">
            {pickQuery.isLoading && picks.length > 0 ? (
              <MarketSkeleton />
            ) : pick ? (
              <>
                <OrderBook orders={pick.orders} />
                {viewerOpenOrders.length > 0 && (
                  <div className="mt-6 flex flex-col gap-3">
                    {viewerOpenOrders.map((order) => (
                      <PartialFillRow key={order.id} order={order} pick={pick} onCancel={handleCancel} cancelling={cancelOrder.isPending} />
                    ))}
                  </div>
                )}
                <div className="mt-8">
                  <MarketTape pick={pick} />
                </div>
              </>
            ) : (
              <EmptyState
                tone="dark"
                title="A clean order book."
                body="No one has opened a market on this game yet. Create the first pick and name your price."
                action={{ label: 'Create a pick', onClick: openSheet }}
              />
            )}
          </div>
        </div>

        <div className="md:col-start-2 md:border-l md:border-forest-rule md:pl-6 xl:col-start-3 xl:col-end-4 xl:row-start-1">
          {pick && (
            <>
              <div className="hidden md:block">
                <OrderTicket
                  pick={pick}
                  available={available}
                  disabled={pickLocked}
                  disabledReason={pickLocked ? lockedReason : undefined}
                />
              </div>
              <div className="md:hidden">
                <OrderTicket
                  pick={pick}
                  available={available}
                  disabled={pickLocked}
                  disabledReason={pickLocked ? lockedReason : undefined}
                  tone="cream"
                />
              </div>
              <div className="mt-5 border border-forest-rule p-4">
                <p className="label text-parchment">OFFICIAL RESULT → LEDGER</p>
                <p className="mt-2 text-[11px] leading-[1.6] text-parchment/70">
                  Matched points stay committed until settlement. No cashout. No leverage. Only your funds.
                </p>
              </div>
            </>
          )}
        </div>

        {pick && positions.length > 0 && (
          <div className="border border-parchment bg-parchment p-4 text-ink md:hidden">
            <p className="label text-muted">YOUR {sideTeam?.abbrev} POSITION</p>
            <div className="mt-3 flex flex-col gap-2">
              {positions.map((pos) => (
                <div key={pos.side} className="text-[12px]">
                  <div className="flex justify-between">
                    <span className={pos.side === 'WITH' ? 'text-forest' : 'text-burgundy'}>{pos.side}</span>
                    <span className="font-mono">{pos.matchedStake} pts @ {formatAmerican(pos.avgOdds)}</span>
                  </div>
                  <div className="mt-1 flex justify-between text-muted">
                    <span>Max loss {pos.maxLoss} pts</span>
                    <span className="text-forest">{signedPts(pos.potentialProfit)} if {pos.side === 'WITH' ? 'won' : 'lost'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <TerminalTabs
        gamePicks={picks}
        myOrders={myGameOrders}
        transactions={transactions.data?.items ?? []}
        onCancel={handleCancel}
        cancelling={cancelOrder.isPending}
      />

      {sheetOpen && g && (
        <NewPickSheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          game={g}
          available={available}
          onCreated={selectPick}
        />
      )}
    </div>
  );
}
