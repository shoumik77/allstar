import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Loader2, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import type { GamePicksResponse, GamePick } from '@/lib/types';
import { formatAmerican, formatKickoff, formatSpread } from '@/lib/format';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function FeedPage() {
  const query = useQuery({
    queryKey: ['picks'],
    queryFn: () => api<GamePicksResponse>('/picks'),
  });

  const [takeSide, setTakeSide] = useState<Record<string, 'WITH' | 'AGAINST' | null>>({});
  const [takeStake, setTakeStake] = useState<Record<string, string>>({});

  const joinMutation = useMutation({
    mutationFn: ({ pickId, body }: { pickId: string; body: unknown }) =>
      api(`/picks/${pickId}/orders`, { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => query.refetch(),
  });

  if (query.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
      </div>
    );
  }

  const picks = query.data?.picks ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Open picks</h1>
        <Link to="/games" className={cn(buttonVariants({ size: 'sm' }))}>
          <Plus className="h-4 w-4" />
          Create pick
        </Link>
      </div>

      {picks.length === 0 && <p className="text-sm text-slate-400">No open picks yet.</p>}

      {picks.map((pick) => (
        <PickCard
          key={pick.id}
          pick={pick}
          side={takeSide[pick.id] ?? null}
          setSide={(side) => setTakeSide((s) => ({ ...s, [pick.id]: side }))}
          stake={takeStake[pick.id] ?? ''}
          setStake={(stake) => setTakeStake((s) => ({ ...s, [pick.id]: stake }))}
          onPlace={() => {
            const parsed = Number(takeStake[pick.id]);
            if (!Number.isInteger(parsed) || parsed < 10 || !takeSide[pick.id]) return;
            joinMutation.mutate({ pickId: pick.id, body: { side: takeSide[pick.id], risked: parsed } });
          }}
          busy={joinMutation.isPending}
        />
      ))}
    </div>
  );
}

function PickCard({
  pick,
  side,
  setSide,
  stake,
  setStake,
  onPlace,
  busy,
}: {
  pick: GamePick;
  side: 'WITH' | 'AGAINST' | null;
  setSide: (side: 'WITH' | 'AGAINST' | null) => void;
  stake: string;
  setStake: (s: string) => void;
  onPlace: () => void;
  busy: boolean;
}) {
  const line = pick.type === 'SPREAD' ? formatSpread(pick.line) : null;
  const market = formatAmerican(pick.sideOdds);
  const fadeMarket = formatAmerican(pick.fadeOdds);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {pick.game.awayTeam} @ {pick.game.homeTeam}
        </CardTitle>
        <CardDescription>
          {pick.type} · {pick.side} {line ?? market} · {formatKickoff(pick.game.kickoff)} · {pick.creator.username}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
            <div className="text-slate-500">WITH</div>
            <div className="font-mono font-medium">{pick.book.withAvailable} pts available</div>
            <div className="text-slate-500">{market}</div>
          </div>
          <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
            <div className="text-slate-500">AGAINST</div>
            <div className="font-mono font-medium">{pick.book.againstAvailable} pts available</div>
            <div className="text-slate-500">{fadeMarket}</div>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="grid flex-1 grid-cols-2 gap-2">
            <Button
              type="button"
              variant={side === 'WITH' ? 'default' : 'outline'}
              onClick={() => setSide('WITH')}
            >
              WITH
            </Button>
            <Button
              type="button"
              variant={side === 'AGAINST' ? 'default' : 'outline'}
              onClick={() => setSide('AGAINST')}
            >
              AGAINST
            </Button>
          </div>
          <Input
            type="number"
            placeholder="Stake"
            value={stake}
            onChange={(e) => setStake(e.target.value)}
            className="sm:w-32"
          />
          <Button onClick={onPlace} disabled={busy || !side || !stake}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            Place
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
