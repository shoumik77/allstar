import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Game, PlaceOrderResponse } from '@/lib/types';
import { formatAmerican, formatKickoff, formatSpread } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function CreatePickPage() {
  const { search } = useLocation();
  const navigate = useNavigate();
  const { me } = useAuth();
  const gameId = new URLSearchParams(search).get('gameId');

  const [type, setType] = useState<'MONEYLINE' | 'SPREAD'>('MONEYLINE');
  const [side, setSide] = useState<'HOME' | 'AWAY'>('HOME');
  const [stake, setStake] = useState('');
  const [limitOdds, setLimitOdds] = useState('');
  const [error, setError] = useState<string | null>(null);

  const gameQuery = useQuery({
    queryKey: ['games'],
    queryFn: () => api<{ games: Game[] }>('/games'),
    enabled: !!gameId,
  });
  const game = gameQuery.data?.games.find((g) => g.id === gameId);

  const mutation = useMutation({
    mutationFn: (body: unknown) => api<PlaceOrderResponse>('/picks', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => navigate('/feed'),
  });

  if (gameQuery.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-ink-soft" />
      </div>
    );
  }

  if (!game) {
    return (
      <p className="border-2 border-varsity bg-paper-raised p-3 font-pixel text-[10px] uppercase text-varsity">
        Game not found
      </p>
    );
  }

  const g = game;
  const available = me?.balance.available ?? 0;
  const maxRisk = Math.floor(available * 0.25);
  const marketOdds = side === 'HOME' ? g.homeMoneyline : g.awayMoneyline;
  const spread = side === 'HOME' ? g.spread : g.spread === null ? null : -g.spread;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = Number(stake);
    if (!Number.isInteger(parsed) || parsed < 10 || parsed > maxRisk) {
      setError(`Stake must be an integer between 10 and ${maxRisk}`);
      return;
    }
    mutation.mutate({
      gameId: g.id,
      type,
      side,
      stake: parsed,
      ...(limitOdds ? { limitOdds: Number(limitOdds) } : {}),
    });
  }

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Create a Pick</CardTitle>
          <CardDescription className="font-pixel text-[9px] uppercase leading-relaxed">
            {g.awayTeam} @ {g.homeTeam} · {formatKickoff(g.kickoff)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant={type === 'MONEYLINE' ? 'default' : 'outline'} onClick={() => setType('MONEYLINE')}>
                Moneyline
              </Button>
              <Button type="button" variant={type === 'SPREAD' ? 'default' : 'outline'} onClick={() => setType('SPREAD')}>
                Spread
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant={side === 'HOME' ? 'default' : 'outline'} onClick={() => setSide('HOME')}>
                {g.homeTeam}
              </Button>
              <Button type="button" variant={side === 'AWAY' ? 'default' : 'outline'} onClick={() => setSide('AWAY')}>
                {g.awayTeam}
              </Button>
            </div>

            {type === 'SPREAD' && (
              <div className="flex items-center justify-between border-2 border-ink bg-paper-sunken p-3">
                <span className="font-pixel text-[8px] uppercase text-ink-soft">Spread</span>
                <span className="font-pixel text-[11px]">{formatSpread(spread)}</span>
              </div>
            )}

            <div className="flex items-center justify-between border-2 border-ink bg-paper-sunken p-3">
              <span className="font-pixel text-[8px] uppercase text-ink-soft">Market Odds</span>
              <span className="font-pixel text-[11px] text-field">{formatAmerican(marketOdds)}</span>
            </div>

            <Input
              type="number"
              placeholder={`Stake (max ${maxRisk})`}
              value={stake}
              onChange={(e) => setStake(e.target.value)}
              min={10}
              max={maxRisk}
              required
            />

            <Input
              type="number"
              placeholder="Limit odds (optional, defaults to market)"
              value={limitOdds}
              onChange={(e) => setLimitOdds(e.target.value)}
            />

            {(error || mutation.error) && (
              <p className="border-2 border-varsity bg-paper-sunken p-2 font-pixel text-[9px] uppercase leading-relaxed text-varsity">
                {error ?? (mutation.error instanceof Error ? mutation.error.message : 'Failed')}
              </p>
            )}

            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Post pick
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
