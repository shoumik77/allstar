/// <reference types="vite/client" />
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Loader2, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import type { GamesResponse } from '@/lib/types';
import { formatAmerican, formatKickoff, formatSpread } from '@/lib/format';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

function SimulateGame({ gameId }: { gameId: string }) {
  const queryClient = useQueryClient();
  const [home, setHome] = useState('');
  const [away, setAway] = useState('');

  const { mutate, isPending } = useMutation({
    mutationFn: (body: { homeScore?: number; awayScore?: number }) =>
      api<unknown>(`/admin/games/${gameId}/simulate`, { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['games'] });
      queryClient.invalidateQueries({ queryKey: ['picks'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });

  const handleSimulate = () => {
    const homeScore = home.trim() === '' ? undefined : Number(home);
    const awayScore = away.trim() === '' ? undefined : Number(away);
    mutate({ homeScore, awayScore });
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        placeholder="H"
        value={home}
        onChange={(e) => setHome(e.target.value)}
        className="h-8 w-14 text-center"
      />
      <Input
        type="number"
        placeholder="A"
        value={away}
        onChange={(e) => setAway(e.target.value)}
        className="h-8 w-14 text-center"
      />
      <Button size="sm" variant="outline" onClick={handleSimulate} disabled={isPending} className="text-xs">
        {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Simulate'}
      </Button>
    </div>
  );
}

export function GamesPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['games'],
    queryFn: () => api<GamesResponse>('/games'),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-rose-400">{error instanceof Error ? error.message : 'Failed to load games'}</p>;
  }

  const games = data?.games ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold tracking-tight">This week's slate</h1>
        <span className="text-sm text-slate-400">
          Week {data?.week.nflWeekNumber} · {data?.week.season}
        </span>
      </div>

      {games.length === 0 && (
        <Card>
          <CardContent className="p-5 text-sm text-slate-400">
            No games synced yet. Run <code className="text-slate-200">npm run seed --workspace backend</code>.
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        {games.map((game) => {
          const homeSpread = game.spread;
          const awaySpread = homeSpread === null ? null : -homeSpread;

          return (
            <Card key={game.id}>
              <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="text-xs uppercase tracking-wide text-slate-500">{formatKickoff(game.kickoff)}</div>
                  <div className="mt-1 truncate text-base font-semibold">
                    {game.awayTeam} <span className="text-slate-500">@</span> {game.homeTeam}
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                    <div className="text-slate-400">Away</div>
                    <div className="text-slate-400">Home</div>
                    <div className="font-mono">
                      {formatSpread(awaySpread)} <span className="text-slate-500">({formatAmerican(game.awaySpreadOdds)})</span>
                    </div>
                    <div className="font-mono">
                      {formatSpread(homeSpread)} <span className="text-slate-500">({formatAmerican(game.homeSpreadOdds)})</span>
                    </div>
                    <div className="font-mono">{formatAmerican(game.awayMoneyline)}</div>
                    <div className="font-mono">{formatAmerican(game.homeMoneyline)}</div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link to={`/create-pick?gameId=${game.id}`} className={cn(buttonVariants({ size: 'sm' }))}>
                      <Plus className="h-4 w-4" />
                      Create pick
                    </Link>
                    {import.meta.env.DEV && <SimulateGame gameId={game.id} />}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
