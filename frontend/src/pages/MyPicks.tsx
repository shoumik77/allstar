import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { MeResponse } from '@/lib/types';
import { formatAmerican } from '@/lib/format';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function MyPicksPage() {
  const query = useQuery({
    queryKey: ['me'],
    queryFn: () => api<MeResponse>('/me'),
  });

  if (query.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
      </div>
    );
  }

  const orders = query.data?.orders ?? [];

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
    </div>
  );
}
