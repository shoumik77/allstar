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
        <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
      </div>
    );
  }

  const orders = me.data?.orders ?? [];
  const transactions = txns.data?.items ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My picks</h1>
      {orders.length === 0 && <p className="text-sm text-slate-400">You haven't placed any orders yet.</p>}
      {orders.map((o) => (
        <Card key={o.id}>
          <CardHeader>
            <CardTitle className="text-base">
              {o.pick.game.awayTeam} @ {o.pick.game.homeTeam}
            </CardTitle>
            <CardDescription>
              {o.side} · risked {o.risked} · matched {o.matched} · {o.pick.type} {o.pick.side} · {o.pick.status}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="text-slate-500">Limit odds:</span>{' '}
              <span className="font-mono">{formatAmerican(o.limitOdds)}</span>
            </div>
            <div>
              <span className="text-slate-500">Matched fills:</span>{' '}
              {o.withMatches.length + o.againstMatches.length}
            </div>
            <div>
              <span className="text-slate-500">Remaining:</span>{' '}
              <span className="font-mono">{o.risked - o.matched - o.refunded} pts</span>
            </div>
          </CardContent>
        </Card>
      ))}

      <h2 className="text-xl font-bold">History</h2>
      {transactions.length === 0 && <p className="text-sm text-slate-400">No transactions yet.</p>}
      {transactions.map((t) => (
        <Card key={t.id}>
          <CardContent className="flex items-center justify-between p-4 text-sm">
            <div>
              <div className="font-medium">{t.type}</div>
              <div className="text-slate-500">
                {t.pick ? `${t.pick.game.awayTeam} @ ${t.pick.game.homeTeam}` : t.note ?? ''}
              </div>
              <div className="text-xs text-slate-400">{formatKickoff(t.createdAt)}</div>
            </div>
            <div className={`font-mono font-medium ${t.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {t.amount >= 0 ? '+' : ''}{formatPoints(t.amount)}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
