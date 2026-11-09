import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { formatDateShort, formatPts, signedPts } from '@/lib/format';
import { downloadCsv as dl, ledgerTiles, realizedSeries, toCsv } from '@/lib/ledger';
import { summarizePositions } from '@/lib/positions';
import { useLeaderboard, useMe, useMyOrders, useTransactions } from '@/lib/queries';
import type { MyOrder } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { StatTile } from '@/components/ui/stat-tile';
import { Tabs } from '@/components/ui/tabs';
import { PnlChart } from '@/components/exchange/PnlChart';
import { PositionsTable } from '@/components/exchange/PositionsTable';
import { TransactionsTable, TX_CSV_HEADERS, transactionCsvRows } from '@/components/exchange/TransactionsTable';
import { WeekNav } from '@/components/exchange/WeekNav';

type Row = { order: MyOrder; position: ReturnType<typeof summarizePositions>[number] };

function rowsFor(orders: MyOrder[]): Row[] {
  const rows: Row[] = [];
  for (const position of summarizePositions(orders)) {
    const order = orders.find((o) => o.pickId === position.pickId && o.side === position.side);
    if (order && position.matchedStake > 0) rows.push({ order, position });
  }
  return rows;
}

function LeaderboardSection() {
  const [searchParams, setSearchParams] = useSearchParams();
  const lbWeekParam = searchParams.get('lbWeek');
  const lbWeek = lbWeekParam ? Number(lbWeekParam) : undefined;
  const { data, isLoading } = useLeaderboard(lbWeek);
  const me = useMe();

  const setWeek = (n: number) =>
    setSearchParams((p) => {
      p.set('lbWeek', String(n));
      return p;
    });

  return (
    <section>
      <div className="flex items-end justify-between">
        <h3 className="font-serif text-[32px]">The standings.</h3>
        <div className="flex items-center gap-4">
          <p className="label text-muted">
            WEEK {data?.week.nflWeekNumber ?? '—'} · {data?.rankings.length ?? 0} TRADERS
          </p>
          <WeekNav week={data?.week} weekNumber={data?.week.nflWeekNumber ?? lbWeek ?? 0} onChange={setWeek} />
        </div>
      </div>
      {isLoading ? (
        <Skeleton className="mt-4 h-40 w-full" />
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-parchment">
                {['RANK', 'TRADER', 'AVAILABLE', 'COMMITTED', 'TOTAL', 'SHARE'].map((h) => (
                  <th key={h} className="label font-normal text-muted">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data?.rankings ?? []).map((entry) => {
                const mine = entry.userId === me.data?.user.id;
                return (
                  <tr
                    key={entry.userId}
                    className={cn('min-h-[58px] border-b border-parchment text-[12px]', mine && 'bg-parchment/40')}
                  >
                    <td className="numeral py-3 pr-3">{String(entry.rank).padStart(2, '0')}</td>
                    <td className={cn('py-3 pr-3', mine && 'font-bold')}>{entry.username}</td>
                    <td className="numeral py-3 pr-3">{entry.available.toLocaleString()}</td>
                    <td className="numeral py-3 pr-3">{entry.locked.toLocaleString()}</td>
                    <td className="numeral py-3 pr-3">{entry.total.toLocaleString()}</td>
                    <td className="numeral py-3 pr-3">{(entry.share * 100).toFixed(1)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function PortfolioPage() {
  const me = useMe();
  const weekOrders = useMyOrders('week');
  const allOrders = useMyOrders('all');
  const transactions = useTransactions({ limit: 100 });
  const [tab, setTab] = useState('open');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const tiles = useMemo(
    () => (me.data ? ledgerTiles(me.data, weekOrders.data?.orders ?? []) : null),
    [me.data, weekOrders.data],
  );
  const items = transactions.data?.items ?? [];
  const series = useMemo(() => realizedSeries(items), [items]);
  const realized = items
    .filter((t) => t.type === 'PAYOUT' || t.type === 'SETTLEMENT_LOSS')
    .reduce((s, t) => s + t.amount, 0);

  const weekRows = useMemo(() => rowsFor(weekOrders.data?.orders ?? []), [weekOrders.data]);
  const allRows = useMemo(() => rowsFor(allOrders.data?.orders ?? []), [allOrders.data]);
  const openRows = weekRows.filter((r) => r.position.status === 'PENDING' || r.position.status === 'MIXED');
  const settledRows = allRows.filter(
    (r) => r.position.status === 'WON' || r.position.status === 'LOST' || r.position.status === 'PUSH',
  );

  const filteredTx = typeFilter === 'ALL' ? items : items.filter((t) => t.type === typeFilter);
  const shownTx = filteredTx.slice(0, 8);

  const total = tiles?.total ?? 0;
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);
  const firstDate = series[0]?.t;
  const lastDate = series[series.length - 1]?.t;
  const peak = series.reduce((m, p) => Math.max(m, p.cumulative), 0);
  const latest = series[series.length - 1]?.cumulative ?? 0;

  const loading = me.isLoading || weekOrders.isLoading || transactions.isLoading;

  const exportStatement = () => {
    dl('allstar-statement.csv', toCsv(TX_CSV_HEADERS, transactionCsvRows(items)));
  };

  return (
    <div className="flex flex-col gap-7 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label text-muted">ACCOUNT / {(me.data?.user.username ?? '').toUpperCase()}</p>
          <h2 className="mt-1 font-serif text-[44px] leading-none md:text-[56px]">The Ledger</h2>
          <p className="mt-3 max-w-xl text-[13px] leading-[1.7] text-muted">
            Every point accounted for. Your capital, your commitments, your settled results.
          </p>
          <Link to="/activity" className="mt-2 inline-block text-[13px] font-semibold text-forest hover:underline md:hidden">
            Activity →
          </Link>
        </div>
        <Button variant="secondary" onClick={exportStatement}>
          Export statement ↓
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 bg-forest p-7 md:grid-cols-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : me.isError ? (
        <ErrorState message="Your ledger could not be loaded." onRetry={() => void me.refetch()} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 bg-forest p-7 md:grid-cols-4">
            <StatTile
              tone="forest"
              label="TOTAL CAPITAL"
              value={(tiles?.total ?? 0).toLocaleString()}
              caption="Available + committed · no unrealized P&L"
            />
            <StatTile tone="forest" label="AVAILABLE" value={(tiles?.available ?? 0).toLocaleString()} caption="Points ready to trade" />
            <StatTile
              tone="forest"
              label="COMMITTED"
              value={(tiles?.committed ?? 0).toLocaleString()}
              caption={`${tiles?.matched ?? 0} pts matched + ${tiles?.unmatched ?? 0} pts unmatched`}
            />
            <StatTile
              tone="forest"
              label="REALIZED P&L"
              value={signedPts(realized)}
              valueTone={realized >= 0 ? 'positive' : 'negative'}
              caption="Settled positions · this week"
            />
          </div>

          <div className="grid gap-8 xl:grid-cols-[1fr_356px]">
            <section>
              <div className="flex items-end justify-between">
                <div>
                  <p className="label text-muted">SETTLED RESULTS ONLY</p>
                  <h3 className="mt-1 font-serif text-[32px]">A measured performance.</h3>
                </div>
                <p className="font-mono text-[12px] text-muted">
                  {firstDate && lastDate
                    ? `${formatDateShort(firstDate.toISOString()).split('·')[0]?.trim()} — ${formatDateShort(lastDate.toISOString()).split('·')[0]?.trim()} · PTS`
                    : 'PTS'}
                </p>
              </div>
              <div className="mt-4">
                <PnlChart series={series} />
                <p className="mt-3 text-[11px] leading-[1.6] text-muted">
                  Cumulative realized P&L. Peak {signedPts(peak)}; latest {signedPts(latest)}. No mark-to-market
                  estimate on unsettled games.
                </p>
              </div>
            </section>

            <Card tone="cream" className="p-5">
              <p className="label text-muted">CAPITAL RECONCILIATION · THIS WEEK</p>
              <h3 className="mt-1 font-serif text-[28px]">Nothing off the books.</h3>
              <div className="mt-4 flex flex-col gap-2">
                {[
                  ['Weekly allocation', formatPts(1000)],
                  ['Realized P&L', signedPts(realized)],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between text-[12px]">
                    <span className="text-muted">{label}</span>
                    <span className="font-mono">{value}</span>
                  </div>
                ))}
                <div className="border-t border-parchment" />
                <div className="flex justify-between text-[13px]">
                  <span className="font-semibold">Total capital</span>
                  <span className="font-mono">{formatPts(total)}</span>
                </div>
              </div>
              <div className="mt-4 flex h-10">
                <div className="bg-forest" style={{ width: `${pct(tiles?.available ?? 0)}%` }} />
                <div className="bg-gold" style={{ width: `${pct(tiles?.matched ?? 0)}%` }} />
                <div className="bg-parchment" style={{ width: `${pct(tiles?.unmatched ?? 0)}%` }} />
              </div>
              <p className="mt-3 font-mono text-[11px] text-muted">
                {pct(tiles?.available ?? 0)}% available · {pct(tiles?.matched ?? 0)}% matched exposure ·{' '}
                {pct(tiles?.unmatched ?? 0)}% unmatched order reserve
              </p>
            </Card>
          </div>

          <section>
            <Tabs
              items={[
                { id: 'open', label: 'Open positions', count: openRows.length },
                { id: 'settled', label: 'Settled positions', count: settledRows.length },
              ]}
              value={tab}
              onChange={setTab}
            />
            <div className="mt-4">
              {(tab === 'open' ? openRows : settledRows).length === 0 ? (
                <EmptyState
                  compact
                  title={tab === 'open' ? 'Nothing at stake yet.' : 'No settled positions yet.'}
                  body={tab === 'open' ? 'Matched bets appear here once another trader takes your price.' : 'Final results land here once games settle.'}
                />
              ) : (
                <>
                  <div className="hidden md:block">
                    <PositionsTable rows={tab === 'open' ? openRows : settledRows} settled={tab === 'settled'} />
                  </div>
                  <div className="flex flex-col gap-3 md:hidden">
                    <PositionsTable rows={tab === 'open' ? openRows : settledRows} settled={tab === 'settled'} mobileCards />
                  </div>
                </>
              )}
            </div>
          </section>

          <section>
            <div className="flex items-end justify-between gap-3">
              <h3 className="font-serif text-[32px]">The transaction record</h3>
              <div className="flex items-center gap-3">
                <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-44" aria-label="Transaction type filter">
                  <option value="ALL">ALL TRANSACTIONS</option>
                  {['STAKE', 'REFUND', 'PAYOUT', 'SETTLEMENT_LOSS', 'ORDER_CANCEL', 'UNMATCHED_REFUND', 'WEEKLY_RESET'].map((t) => (
                    <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
                  ))}
                </Select>
                <span className="hidden font-condensed text-[12px] uppercase tracking-[0.02em] text-muted md:block">NEWEST FIRST</span>
              </div>
            </div>
            <div className="mt-4">
              {shownTx.length === 0 ? (
                <EmptyState compact title="No ledger entries yet." body="Transactions appear as you trade." />
              ) : (
                <>
                  <div className="hidden md:block">
                    <TransactionsTable items={shownTx} />
                  </div>
                  <div className="flex flex-col gap-3 md:hidden">
                    <TransactionsTable items={shownTx} mobileCards />
                  </div>
                </>
              )}
              {filteredTx.length > 8 && (
                <Link to="/activity" className="mt-4 inline-block text-[13px] font-semibold text-forest hover:underline">
                  View all activity →
                </Link>
              )}
              <p className="mt-4 text-[12px] text-muted">
                Settlement rows show net profit or loss; returned stakes are not income. Reservations change
                availability, not total capital.
              </p>
            </div>
          </section>

          <LeaderboardSection />
        </>
      )}
    </div>
  );
}
