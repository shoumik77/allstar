import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { LeaderboardResponse } from '@/lib/types';
import { formatPoints } from '@/lib/format';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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
      <h1 className="text-2xl font-bold">Leaderboard</h1>

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
          <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
        </div>
      )}

      {query.data && (
        <Card>
          <CardHeader>
            <CardTitle>Week {query.data.week.nflWeekNumber}</CardTitle>
            <CardDescription>
              {query.data.week.status} · {formatPoints(query.data.rankings.length)} users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="pb-2">Rank</th>
                    <th className="pb-2">User</th>
                    <th className="pb-2 text-right">Available</th>
                    <th className="pb-2 text-right">Locked</th>
                    <th className="pb-2 text-right">Total</th>
                    <th className="pb-2 text-right">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.rankings.map((row) => (
                    <tr key={row.userId} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="py-2 font-mono">{row.rank}</td>
                      <td className="py-2">{row.username}</td>
                      <td className="py-2 text-right font-mono">{row.available}</td>
                      <td className="py-2 text-right font-mono">{row.locked}</td>
                      <td className="py-2 text-right font-mono">{row.total}</td>
                      <td className="py-2 text-right font-mono">{(row.share * 100).toFixed(1)}%</td>
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
