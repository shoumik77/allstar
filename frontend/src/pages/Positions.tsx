import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { remainingOf } from '@/lib/book';
import { signedPts } from '@/lib/format';
import { summarizePositions } from '@/lib/positions';
import { useMyOrders } from '@/lib/queries';
import type { MyOrder } from '@/lib/types';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { StatTile } from '@/components/ui/stat-tile';
import { Button } from '@/components/ui/button';
import { PositionCard } from '@/components/exchange/PositionCard';
import { PositionsTable } from '@/components/exchange/PositionsTable';

type Row = { order: MyOrder; position: ReturnType<typeof summarizePositions>[number] };

function rowsFor(orders: MyOrder[]): Row[] {
  const summaries = summarizePositions(orders);
  const rows: Row[] = [];
  for (const position of summaries) {
    const order = orders.find((o) => o.pickId === position.pickId && o.side === position.side);
    if (order && position.matchedStake > 0) rows.push({ order, position });
  }
  return rows;
}

export function PositionsPage() {
  const navigate = useNavigate();
  const weekOrders = useMyOrders('week');
  const allOrders = useMyOrders('all');

  const weekRows = useMemo(() => rowsFor(weekOrders.data?.orders ?? []), [weekOrders.data]);
  const allRows = useMemo(() => rowsFor(allOrders.data?.orders ?? []), [allOrders.data]);

  const active = weekRows.filter((r) => r.position.status === 'PENDING' || r.position.status === 'MIXED');
  const settled = allRows
    .filter((r) => r.position.status === 'WON' || r.position.status === 'LOST' || r.position.status === 'PUSH')
    .sort((a, b) => b.order.pick.game.kickoff.localeCompare(a.order.pick.game.kickoff));

  const exposure = active.reduce((s, r) => s + r.position.maxLoss, 0);
  const reserve = (weekOrders.data?.orders ?? []).reduce((s, o) => s + remainingOf(o), 0);
  const realized = allRows.reduce((s, r) => s + r.position.realized, 0);
  const liveCount = active.filter((r) => r.order.pick.game.status === 'IN_PROGRESS').length;
  const games = new Set(active.map((r) => r.order.pick.gameId)).size;
  const markets = new Set(active.map((r) => r.order.pick.type));

  const loading = weekOrders.isLoading || allOrders.isLoading;

  return (
    <div className="flex flex-col gap-7 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label text-muted">
            YOUR BOOK / NFL {markets.size === 1 ? [...markets][0] : 'MARKETS'}
          </p>
          <h2 className="mt-1 font-serif text-[44px] leading-none md:text-[56px]">A stake in the outcome.</h2>
          <p className="mt-3 max-w-xl text-[13px] leading-[1.7] text-muted">
            Matched bets live here until the final whistle and the official result. No paper gains. No early cashout.
          </p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/markets')}>
          Browse markets ↗
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 bg-ink p-7 md:grid-cols-4">
        <StatTile
          tone="dark"
          label="ACTIVE POSITIONS"
          value={String(active.length).padStart(2, '0')}
          caption={`${games} ${games === 1 ? 'game' : 'games'} · ${liveCount > 0 ? `${liveCount} live` : 'all pregame'}`}
        />
        <StatTile tone="dark" label="MATCHED EXPOSURE" value={exposure.toLocaleString()} caption="Maximum combined loss" />
        <StatTile
          tone="dark"
          label="UNMATCHED RESERVE"
          value={reserve.toLocaleString()}
          caption="Not included in active positions"
        />
        <StatTile
          tone="dark"
          label="SETTLED P&L"
          value={signedPts(realized)}
          valueTone={realized >= 0 ? 'positive' : 'negative'}
          caption={`${settled.length} settled ${settled.length === 1 ? 'position' : 'positions'} · all time`}
        />
      </div>

      <section>
        <div className="flex items-end justify-between">
          <h3 className="font-serif text-[32px]">Still in the game.</h3>
          <p className="label text-muted">ACTIVE · WEEK {weekOrders.data?.week.nflWeekNumber ?? '—'}</p>
        </div>
        {loading ? (
          <div className="mt-4 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        ) : weekOrders.isError ? (
          <ErrorState message="Your positions could not be loaded." onRetry={() => void weekOrders.refetch()} />
        ) : active.length === 0 ? (
          <EmptyState
            className="mt-4"
            title="Nothing at stake yet."
            body="Matched bets appear here once another trader takes your price."
            action={{ label: 'Browse markets', onClick: () => navigate('/markets') }}
          />
        ) : (
          <div className="mt-4 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {active.map((row) => (
              <PositionCard key={`${row.order.pickId}-${row.position.side}`} {...row} />
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-4 bg-parchment p-5 md:grid-cols-[160px_1fr]">
        <p className="label">UNDERSTAND YOUR EXPOSURE</p>
        <p className="text-[12px] leading-[1.7]">
          WITH exposure equals your stake. AGAINST exposure is your posted liability — you win the backer's stake.
          Potential profit is what the other side risked against you. Total funds returned includes released exposure
          plus profit.
        </p>
      </div>

      <section>
        <div className="flex items-end justify-between">
          <h3 className="font-serif text-[32px]">In the record books.</h3>
          <p className="label text-muted">SETTLED · ALL WEEKS</p>
        </div>
        <div className="mt-4">
          {settled.length === 0 ? (
            <EmptyState compact title="No settled positions yet." body="Final results land here once games settle." />
          ) : (
            <>
              <div className="hidden md:block">
                <PositionsTable rows={settled} settled />
              </div>
              <div className="flex flex-col gap-3 md:hidden">
                <PositionsTable rows={settled} settled mobileCards />
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-ink pt-4">
                <p className="label">FINAL RESULTS VERIFIED · NET SETTLEMENT</p>
                <p className={`numeral text-[24px] ${realized >= 0 ? 'text-forest' : 'text-burgundy'}`}>
                  {signedPts(realized)}
                </p>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
