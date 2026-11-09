import { useState } from 'react';
import { ApiError } from '@/lib/api';
import { formatAmerican, formatSpread } from '@/lib/format';
import { useCreatePick } from '@/lib/queries';
import type { Game } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Segmented } from '@/components/ui/segmented';
import { useToast } from '@/components/ui/toast';
import { stakeError } from './OrderTicket';

export function NewPickSheet({
  open,
  onClose,
  game,
  available,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  game: Game;
  available: number;
  onCreated: (pickId: string) => void;
}) {
  const { toast } = useToast();
  const createPick = useCreatePick();
  const [type, setType] = useState<'MONEYLINE' | 'SPREAD'>('MONEYLINE');
  const [side, setSide] = useState<'HOME' | 'AWAY'>('HOME');
  const [stakeRaw, setStakeRaw] = useState('');
  const [touched, setTouched] = useState(false);

  const stake = stakeRaw.trim() === '' ? null : Number(stakeRaw);
  const sErr = stakeError(stake, available);
  const valid = stake !== null && !sErr;

  const snapshotOdds =
    type === 'MONEYLINE'
      ? side === 'HOME'
        ? game.homeMoneyline
        : game.awayMoneyline
      : side === 'HOME'
        ? game.homeSpreadOdds
        : game.awaySpreadOdds;

  const submit = async () => {
    try {
      const pick = await createPick.mutateAsync({ gameId: game.id, type, side, stake: stake! });
      onCreated(pick.id);
      onClose();
      toast({ variant: 'success', title: 'Pick created', body: 'Your market is live. Others can now take the other side.' });
    } catch (err) {
      toast({
        variant: 'error',
        title: 'Pick rejected',
        body: err instanceof ApiError ? err.message : 'Something went wrong creating the pick.',
      });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} labelledBy="new-pick-title">
      <p className="label text-forest">NEW MARKET</p>
      <h3 id="new-pick-title" className="mt-2 font-serif text-[40px] leading-[1.05]">
        Name your price.
      </h3>
      <p className="mt-1 text-[12px] text-muted">
        {game.awayTeam} @ {game.homeTeam} · {formatAmerican(snapshotOdds)} snapshot{game.spread !== null && type === 'SPREAD' ? ` · ${formatSpread(game.spread)}` : ''}
      </p>

      <div className="mt-5 flex flex-col gap-4">
        <div>
          <p className="label mb-2 text-muted">MARKET</p>
          <Segmented
            options={[
              { id: 'MONEYLINE' as const, label: 'MONEYLINE' },
              { id: 'SPREAD' as const, label: `SPREAD ${formatSpread(game.spread)}` },
            ]}
            value={type}
            onChange={setType}
          />
        </div>
        <div>
          <p className="label mb-2 text-muted">SIDE</p>
          <Segmented
            options={[
              { id: 'AWAY' as const, label: game.awayTeam.toUpperCase() },
              { id: 'HOME' as const, label: game.homeTeam.toUpperCase() },
            ]}
            value={side}
            onChange={setSide}
          />
        </div>
        <div>
          <p className="label mb-2 text-muted">OPENING STAKE</p>
          <Input
            unit="PTS"
            inputMode="numeric"
            value={stakeRaw}
            placeholder="0"
            onChange={(e) => setStakeRaw(e.target.value)}
            onBlur={() => setTouched(true)}
          />
          {touched && sErr && <p className="mt-2 text-[12px] text-burgundy">{sErr}</p>}
        </div>
      </div>

      <div className="mt-5 flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={onClose} disabled={createPick.isPending}>
          Back
        </Button>
        <Button variant="primary" className="flex-1" disabled={!valid || createPick.isPending} onClick={() => void submit()}>
          {createPick.isPending ? 'Creating…' : 'Create pick'}
        </Button>
      </div>
    </Dialog>
  );
}
