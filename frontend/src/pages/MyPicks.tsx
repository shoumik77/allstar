import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { MeResponse, TransactionsResponse } from '@/lib/types';
import { formatAmerican, formatKickoff, formatPoints } from '@/lib/format';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function MyPicksPage() {
  const me = useQuery({
    queryKey: ['me'],
    queryFn: () => api<MeResponse>('/me'),
  });
  const txns = useQuery({
    queryKey: ['me-transactions'],
    queryFn: () => api<TransactionsResponse>('/me/transactions'),
  });

  if (me.isLoading || txns.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-ink-soft" />
      </div>
    );
  }

  const orders = me.data?.orders ?? [];
  const transactions = txns.data?.items ?? [];

  return (
    <div className="space-y-6">
      <h1 className="rule-dashed pb-3 font-pixel text-lg uppercase tracking-tight">My Picks</h1>
      {orders.length === 0 && (
        <p className="font-pixel text-[10px] uppercase text-ink-soft">You haven't placed any orders yet.</p>
      )}
      {orders.map((o) => (
        <Card key={o.id}>
          <CardHeader>
            <CardTitle className="text-base">
              {o.pick.game.awayTeam} @ {o.pick.game.homeTeam}
            </CardTitle>
            <CardDescription className="font-pixel text-[9px] uppercase leading-relaxed">
              {o.side} · risked {o.risked} · matched {o.matched} · {o.pick.type} {o.pick.side} · {o.pick.status}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-2 border-t-2 border-dashed border-ink/30 pt-3">
            <div>
              <div className="font-pixel text-[8px] uppercase text-ink-soft">Limit Odds</div>
              <div className="mt-1 font-pixel text-[11px]">{formatAmerican(o.limitOdds)}</div>
            </div>
            <div>
              <div className="font-pixel text-[8px] uppercase text-ink-soft">Fills</div>
              <div className="mt-1 font-pixel text-[11px]">
                {o.withMatches.length + o.againstMatches.length}
              </div>
            </div>
            <div>
              <div className="font-pixel text-[8px] uppercase text-ink-soft">Remaining</div>
              <div className="mt-1 font-pixel text-[11px]">{o.risked - o.matched - o.refunded} PTS</div>
            </div>
          </CardContent>
        </Card>
      ))}

      <h2 className="rule-dashed pb-3 font-pixel text-base uppercase tracking-tight">History</h2>
      {transactions.length === 0 && (
        <p className="font-pixel text-[10px] uppercase text-ink-soft">No transactions yet.</p>
      )}
      {transactions.map((t) => (
        <Card key={t.id}>
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <div className="font-pixel text-[10px] uppercase">{t.type}</div>
              <div className="mt-1 truncate text-sm text-ink-soft">
                {t.pick ? `${t.pick.game.awayTeam} @ ${t.pick.game.homeTeam}` : t.note ?? ''}
              </div>
              <div className="mt-1 font-pixel text-[8px] uppercase text-ink-faint">
                {formatKickoff(t.createdAt)}
              </div>
            </div>
            <div
              className={`shrink-0 font-pixel text-xs ${t.amount >= 0 ? 'text-field' : 'text-varsity'}`}
            >
              {t.amount >= 0 ? '+' : ''}
              {formatPoints(t.amount)}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
