import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { remainingOf } from '@/lib/book';
import { formatAmerican, formatDateShort } from '@/lib/format';
import { downloadCsv, toCsv } from '@/lib/ledger';
import { summarizePositions } from '@/lib/positions';
import { useCancelOrder, useMe, useMyOrders } from '@/lib/queries';
import { teamFor } from '@/lib/teams';
import type { MyOrder, OrderStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { StatTile } from '@/components/ui/stat-tile';
import { StatusDot } from '@/components/ui/status-dot';
import { Tabs } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/toast';

const STATUS_LABEL: Record<OrderStatus, string> = {
  OPEN: 'Open',
  PARTIAL: 'Partial',
  FILLED: 'Fully matched',
  CANCELLED: 'Cancelled',
};

const STATUS_DOT: Record<OrderStatus, 'pregame' | 'partial' | 'filled' | 'cancelled'> = {
  OPEN: 'pregame',
  PARTIAL: 'partial',
  FILLED: 'filled',
  CANCELLED: 'cancelled',
};

function matchupLabel(order: MyOrder): string {
  const game = order.pick.game;
  const team = teamFor(order.pick.side === 'HOME' ? game.homeTeam : game.awayTeam);
  return `${teamFor(game.awayTeam).abbrev} @ ${teamFor(game.homeTeam).abbrev} / ${team.nickname}`;
}

function OrderDetail({ order, available, onCancel, cancelling }: { order: MyOrder; available: number; onCancel: () => void; cancelling: boolean }) {
  const remaining = remainingOf(order);
  const team = teamFor(order.pick.side === 'HOME' ? order.pick.game.homeTeam : order.pick.game.awayTeam);
  const matchedPct = order.risked > 0 ? Math.min(100, (order.matched / order.risked) * 100) : 0;

  return (
    <div className="grid gap-6 border-b border-parchment bg-parchment/60 p-5 md:grid-cols-2">
      <div className="flex flex-col gap-3">
        <p className="font-condensed text-[13px] uppercase tracking-[0.02em] text-muted">
          ORDER {order.id.slice(-6).toUpperCase()} · PLACED {formatDateShort(order.createdAt)}
        </p>
        <div className="flex items-center justify-between">
          <p className="font-mono text-[12px]">
            {team.abbrev} · {order.side} · {formatAmerican(order.limitOdds)}
          </p>
          <StatusDot state={STATUS_DOT[order.status]} label={order.matched > 0 ? 'PARTIALLY MATCHED' : 'RESTING'} />
        </div>
        <div className="flex h-[3px]">
          <div className="bg-gold" style={{ width: `${matchedPct}%` }} />
          <div className="flex-1 bg-parchment" />
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <p className="font-mono text-muted">
            {order.matched.toLocaleString()} / {order.risked.toLocaleString()} matched · {remaining.toLocaleString()} remaining
          </p>
          {remaining > 0 && (
            <button onClick={onCancel} disabled={cancelling} className="text-burgundy hover:underline disabled:opacity-40">
              Cancel remainder
            </button>
          )}
        </div>
      </div>
      <div>
        <h3 className="font-serif text-[24px] leading-tight">Only the remainder can be cancelled.</h3>
        <p className="mt-2 text-[14px] leading-[1.6] text-muted">
          {order.matched} pts is already matched at {formatAmerican(order.limitOdds)} and stays in your {team.nickname}{' '}
          position. Cancelling releases the unfilled {remaining} pts reservation, taking available capital to{' '}
          {(available + remaining).toLocaleString()} pts. It does not close or change the matched bet.
        </p>
        <p className="mt-3 font-mono text-[12px] text-muted">
          LIMIT {formatAmerican(order.limitOdds)} · GOOD UNTIL KICKOFF · FIFO AT THE SAME PRICE
        </p>
      </div>
    </div>
  );
}

function OrderRow({
  order,
  expanded,
  onToggle,
  action,
}: {
  order: MyOrder;
  expanded: boolean;
  onToggle: () => void;
  action?: React.ReactNode;
}) {
  const remaining = remainingOf(order);
  return (
    <>
      <tr onClick={onToggle} className="min-h-[58px] cursor-pointer border-b border-parchment text-[12px] hover:bg-parchment/40">
        <td className="py-3 pr-3">{matchupLabel(order)}</td>
        <td className={cn('py-3 pr-3', order.side === 'WITH' ? 'text-forest' : 'text-burgundy')}>{order.side}</td>
        <td className="numeral py-3 pr-3">{formatAmerican(order.limitOdds)}</td>
        <td className="numeral py-3 pr-3">{order.risked.toLocaleString()}</td>
        <td className="numeral py-3 pr-3">{order.matched.toLocaleString()}</td>
        <td className="numeral py-3 pr-3">{remaining.toLocaleString()}</td>
        <td className="py-3 pr-3">{STATUS_LABEL[order.status]}</td>
        <td className="py-3 pr-3 text-right" onClick={(e) => e.stopPropagation()}>
          {action}
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={8} className="p-0">
            {/* detail panel rendered by parent via portal-like row */}
          </td>
        </tr>
      )}
    </>
  );
}

export function OrdersPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const me = useMe();
  const weekOrders = useMyOrders('week');
  const allOrders = useMyOrders('all');
  const cancelOrder = useCancelOrder();

  const [tab, setTab] = useState<'open' | 'partial' | 'filled' | 'cancelled'>('open');
  const [teamFilter, setTeamFilter] = useState('ALL');
  const [sideFilter, setSideFilter] = useState<'BOTH' | 'WITH' | 'AGAINST'>('BOTH');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const available = me.data?.balance.available ?? 0;
  const orders = useMemo(() => weekOrders.data?.orders ?? [], [weekOrders.data]);

  const byStatus = useMemo(
    () => ({
      open: orders.filter((o) => o.status === 'OPEN' || o.status === 'PARTIAL'),
      partial: orders.filter((o) => o.status === 'PARTIAL'),
      filled: orders.filter((o) => o.status === 'FILLED'),
      cancelled: orders.filter((o) => o.status === 'CANCELLED'),
    }),
    [orders],
  );

  const teams = useMemo(() => {
    const names = new Set<string>();
    for (const o of orders) {
      names.add(o.pick.side === 'HOME' ? o.pick.game.homeTeam : o.pick.game.awayTeam);
    }
    return [...names].sort();
  }, [orders]);

  const positions = summarizePositions(orders);
  const maxLoss = positions.reduce((s, p) => s + p.maxLoss, 0);
  const matchedStake = positions.reduce((s, p) => s + p.matchedStake, 0);
  const unfilled = byStatus.open.reduce((s, o) => s + remainingOf(o), 0);

  const tabbed = (byStatus[tab] ?? []).filter((o) => {
    const teamName = o.pick.side === 'HOME' ? o.pick.game.homeTeam : o.pick.game.awayTeam;
    if (teamFilter !== 'ALL' && teamName !== teamFilter) return false;
    if (sideFilter !== 'BOTH' && o.side !== sideFilter) return false;
    return true;
  });

  const record = (allOrders.data?.orders ?? []).filter(
    (o) => o.status === 'FILLED' || o.status === 'CANCELLED',
  );

  const handleCancel = (orderId: string) => {
    cancelOrder.mutate(orderId, {
      onSuccess: (res) => toast({ variant: 'success', title: `Remainder cancelled · ${res.refunded} pts returned` }),
      onError: (err) => toast({ variant: 'error', title: 'Cancel failed', body: err instanceof Error ? err.message : 'Try again.' }),
    });
  };

  const exportCsv = () => {
    const rows = (allOrders.data?.orders ?? []).map((o) => [
      o.id,
      matchupLabel(o),
      o.side,
      formatAmerican(o.limitOdds),
      o.risked,
      o.matched,
      remainingOf(o),
      STATUS_LABEL[o.status],
      formatDateShort(o.createdAt),
    ]);
    downloadCsv(
      'allstar-orders.csv',
      toCsv(['ORDER', 'MATCHUP / TEAM', 'SIDE', 'PRICE', 'STAKE', 'MATCHED', 'REMAINING', 'STATUS', 'PLACED ET'], rows),
    );
  };

  const actionFor = (order: MyOrder) => {
    const remaining = remainingOf(order);
    if ((order.status === 'OPEN' || order.status === 'PARTIAL') && remaining > 0) {
      return (
        <button onClick={() => handleCancel(order.id)} disabled={cancelOrder.isPending} className="text-burgundy hover:underline disabled:opacity-40">
          Cancel remainder
        </button>
      );
    }
    if (order.status === 'FILLED') {
      return (
        <Link to="/positions" className="text-forest hover:underline">
          View position
        </Link>
      );
    }
    return <span className="text-muted">—</span>;
  };

  const loading = weekOrders.isLoading || me.isLoading;

  const mobileCard = (order: MyOrder) => (
    <div key={order.id} className="flex flex-col gap-2 border border-parchment p-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold">{matchupLabel(order)}</p>
        <StatusDot state={STATUS_DOT[order.status]} label={STATUS_LABEL[order.status].toUpperCase()} />
      </div>
      <div className="flex items-center justify-between text-[12px]">
        <span className={order.side === 'WITH' ? 'text-forest' : 'text-burgundy'}>{order.side}</span>
        <span className="font-mono">{formatAmerican(order.limitOdds)}</span>
      </div>
      <p className="font-mono text-[12px] text-muted">
        {order.risked} staked · {order.matched} matched · {remainingOf(order)} remaining
      </p>
      <div>{actionFor(order)}</div>
    </div>
  );

  return (
    <div className="flex flex-col gap-7 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label text-muted">EXECUTION / PRICE–TIME PRIORITY</p>
          <h2 className="mt-1 font-serif text-[44px] leading-none md:text-[56px]">An order is a point of view.</h2>
          <p className="mt-3 max-w-xl text-[13px] leading-[1.7] text-muted">
            Follow every match, every remainder, and every instruction you've placed on the exchange.
          </p>
        </div>
        <Button variant="secondary" onClick={exportCsv}>
          Export orders ↓
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 border-y border-ink py-6 md:grid-cols-4">
        <StatTile
          label="OPEN ORDERS"
          value={String(byStatus.open.length).padStart(2, '0')}
          caption={`${byStatus.partial.length} partially matched`}
        />
        <StatTile label="UNFILLED STAKE" value={unfilled.toLocaleString()} caption="Reserved, not yet exposed to a result" />
        <StatTile
          label="MATCHED STAKE"
          value={matchedStake.toLocaleString()}
          caption={`${maxLoss.toLocaleString()} pts maximum loss across active positions`}
        />
        <StatTile label="AVAILABLE CAPITAL" value={available.toLocaleString()} caption="After all current reservations" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          items={[
            { id: 'open', label: 'Open', count: byStatus.open.length },
            { id: 'partial', label: 'Partial', count: byStatus.partial.length },
            { id: 'filled', label: 'Fully matched', count: byStatus.filled.length },
            { id: 'cancelled', label: 'Cancelled', count: byStatus.cancelled.length },
          ]}
          value={tab}
          onChange={(id) => setTab(id as typeof tab)}
        />
        <div className="flex items-center gap-3">
          <Select value="week" disabled className="w-36" aria-label="Week filter">
            <option value="week">NFL · WEEK {me.data?.week.nflWeekNumber ?? '—'}</option>
          </Select>
          <Select value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)} className="w-40" aria-label="Team filter">
            <option value="ALL">ALL TEAMS</option>
            {teams.map((name) => (
              <option key={name} value={name}>
                {teamFor(name).abbrev}
              </option>
            ))}
          </Select>
          <Select value={sideFilter} onChange={(e) => setSideFilter(e.target.value as typeof sideFilter)} className="w-32" aria-label="Side filter">
            <option value="BOTH">BOTH SIDES</option>
            <option value="WITH">WITH</option>
            <option value="AGAINST">AGAINST</option>
          </Select>
          <span className="hidden font-condensed text-[12px] uppercase tracking-[0.02em] text-muted md:block">
            SORT: NEWEST FIRST ↓
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : weekOrders.isError ? (
        <ErrorState message="Your orders could not be loaded." onRetry={() => void weekOrders.refetch()} />
      ) : tabbed.length === 0 ? (
        <EmptyState
          title="A clean order book."
          body="You have no orders in this view. Find a game, choose a side, and name your price."
          action={{ label: 'Explore markets', onClick: () => navigate('/markets') }}
        />
      ) : (
        <>
          <div className="hidden md:block">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-parchment">
                  {['MATCHUP / TEAM', 'SIDE', 'PRICE', 'STAKE', 'MATCHED', 'REMAINING', 'STATUS', ''].map((h, i) => (
                    <th key={h} className={cn('label font-normal text-muted', i === 7 && 'text-right')}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tabbed.map((order) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    expanded={expandedId === order.id}
                    onToggle={() => setExpandedId(expandedId === order.id ? null : order.id)}
                    action={actionFor(order)}
                  />
                ))}
              </tbody>
            </table>
            {expandedId && tabbed.find((o) => o.id === expandedId) && (
              <OrderDetail
                order={tabbed.find((o) => o.id === expandedId)!}
                available={available}
                onCancel={() => handleCancel(expandedId)}
                cancelling={cancelOrder.isPending}
              />
            )}
          </div>
          <div className="flex flex-col gap-3 md:hidden">{tabbed.map(mobileCard)}</div>
        </>
      )}

      <section>
        <div className="flex items-end justify-between">
          <h3 className="font-serif text-[32px]">The complete record</h3>
          <p className="label text-muted">ALL WEEKS · MATCHED &amp; CANCELLED</p>
        </div>
        <div className="mt-4 hidden md:block">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-parchment">
                {['MATCHUP / TEAM', 'SIDE', 'PRICE', 'STAKE', 'MATCHED', 'STATUS', 'PLACED ET'].map((h, i) => (
                  <th key={h} className={cn('label font-normal text-muted', i === 6 && 'text-right')}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {record.map((order) => (
                <tr key={order.id} className="min-h-[58px] border-b border-parchment text-[12px]">
                  <td className="py-3 pr-3">{matchupLabel(order)}</td>
                  <td className={cn('py-3 pr-3', order.side === 'WITH' ? 'text-forest' : 'text-burgundy')}>{order.side}</td>
                  <td className="numeral py-3 pr-3">{formatAmerican(order.limitOdds)}</td>
                  <td className="numeral py-3 pr-3">{order.risked.toLocaleString()}</td>
                  <td className="numeral py-3 pr-3">{order.matched.toLocaleString()}</td>
                  <td className="py-3 pr-3">{STATUS_LABEL[order.status]}</td>
                  <td className="numeral py-3 pr-3 text-right">{formatDateShort(order.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex flex-col gap-3 md:hidden">{record.map(mobileCard)}</div>
        <p className="mt-4 text-[12px] text-muted">
          Cancelled orders show original stake for audit history, with 0 pts remaining on the book. All unfilled
          reserves have been released.
        </p>
      </section>
    </div>
  );
}
