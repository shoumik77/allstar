import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { LeaderboardResponse } from '@/lib/types';
import { formatPoints } from '@/lib/format';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function LeaderboardPage() {
  const [season, setSeason] = useState(new Date().getUTCFullYear());
  const [week, setWeek] = useState('');

  const params = new URLSearchParams();
  if (week) {
    params.set('week', week);
    params.set('season', season.toString());
  }

  const query = useQuery({
    queryKey: ['leaderboard', season, week],
    queryFn: () => api<LeaderboardResponse>(`/leaderboard?${params.toString()}`),
  });

  return (
    <div className="space-y-4">
      <h1 className="rule-dashed pb-3 font-pixel text-lg uppercase tracking-tight">Leaderboard</h1>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          type="number"
          value={season}
          onChange={(e) => setSeason(Number(e.target.value))}
          placeholder="Season"
          className="sm:w-32"
        />
        <Input
          type="number"
          value={week}
          onChange={(e) => setWeek(e.target.value)}
          placeholder="Week (empty = current)"
          className="sm:w-48"
        />
        <Button onClick={() => query.refetch()}>Refresh</Button>
      </div>

      {query.isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-ink-soft" />
        </div>
      )}

      {query.data && (
        <Card>
          <CardHeader>
            <CardTitle>Week {query.data.week.nflWeekNumber}</CardTitle>
            <CardDescription className="font-pixel text-[9px] uppercase">
              {query.data.week.status} · {formatPoints(query.data.rankings.length)} users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-ink text-left font-pixel text-[8px] uppercase text-ink-soft">
                    <th className="pb-2 pr-2">Rk</th>
                    <th className="pb-2 pr-2">User</th>
                    <th className="pb-2 pr-2 text-right">Avail</th>
                    <th className="pb-2 pr-2 text-right">Lockd</th>
                    <th className="pb-2 pr-2 text-right">Total</th>
                    <th className="pb-2 text-right">Share</th>
                  </tr>
                </thead>
                <tbody className="font-pixel text-[10px]">
                  {query.data.rankings.map((row) => (
                    <tr key={row.userId} className="border-b-2 border-dashed border-ink/25">
                      <td className={cn('py-3 pr-2', row.rank <= 3 && 'text-gold')}>{row.rank}</td>
                      <td className="py-3 pr-2 uppercase">{row.username}</td>
                      <td className="py-3 pr-2 text-right">{row.available}</td>
                      <td className="py-3 pr-2 text-right text-ink-faint">{row.locked}</td>
                      <td className="py-3 pr-2 text-right text-field">{row.total}</td>
                      <td className="py-3 text-right">{(row.share * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
