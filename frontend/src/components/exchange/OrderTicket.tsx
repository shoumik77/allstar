import { useEffect, useMemo, useState } from 'react';
import { ApiError } from '@/lib/api';
import { formatAmerican, formatPts, formatTimeET, profitMultiplier, signedPts } from '@/lib/format';
import { teamFor } from '@/lib/teams';
import { usePlaceOrder } from '@/lib/queries';
import type { GamePick, OrderSide } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Segmented } from '@/components/ui/segmented';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { OrderReviewDialog, type ReviewOrder } from './OrderReviewDialog';

const MIN_RISK = 10;

export function stakeError(risked: number | null, available: number): string | null {
  if (risked === null) return null;
  if (!Number.isInteger(risked)) return 'Stake must be a whole number of points.';
  if (risked < MIN_RISK) return `Minimum stake is ${MIN_RISK} pts.`;
  if (risked > available) return 'Insufficient balance.';
  const cap = Math.floor(available * 0.25);
  if (risked > cap) return `Max stake is 25% of your balance (${cap} pts).`;
  return null;
}

export function oddsError(limitOdds: number | null): string | null {
  if (limitOdds === null) return null;
  if (!Number.isInteger(limitOdds)) return 'Odds must be a whole number.';
  if (limitOdds === 0 || Math.abs(limitOdds) < 100) return 'American odds must be ≤ −100 or ≥ +100.';
  return null;
}

function parseIntOrNull(raw: string): number | null {
  if (raw.trim() === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function OrderTicket({
  pick,
  available,
  disabled,
  disabledReason,
  tone = 'dark',
}: {
  pick: GamePick;
  available: number;
  disabled?: boolean;
  disabledReason?: string;
  tone?: 'dark' | 'cream';
}) {
  const { toast } = useToast();
  const placeOrder = usePlaceOrder();
  const team = teamFor(pick.side === 'HOME' ? pick.game.homeTeam : pick.game.awayTeam);

  const [side, setSide] = useState<OrderSide>('WITH');
  const [oddsRaw, setOddsRaw] = useState(String(pick.sideOdds));
  const [stakeRaw, setStakeRaw] = useState('');
  const [reviewOpen, setReviewOpen] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    setOddsRaw(String(pick.sideOdds));
  }, [pick.id, pick.sideOdds]);

  const limitOdds = parseIntOrNull(oddsRaw);
  const risked = parseIntOrNull(stakeRaw);
  const oErr = oddsError(limitOdds);
  const sErr = stakeError(risked, available);
  const valid = limitOdds !== null && risked !== null && !oErr && !sErr && !disabled;

  const summary = useMemo(() => {
    if (limitOdds === null || risked === null || oErr) return null;
    const m = profitMultiplier(limitOdds);
    const profit = side === 'WITH' ? Math.round(risked * m) : Math.floor(risked / m);
    return { profit, payout: risked + profit, maxLoss: risked };
  }, [limitOdds, risked, side, oErr]);

  const dark = tone === 'dark';
  const text = dark ? 'text-cream' : 'text-ink';
  const sub = dark ? 'text-parchment' : 'text-muted';
  const rule = dark ? 'border-forest-rule' : 'border-parchment';

  const order: ReviewOrder = { side, limitOdds: limitOdds ?? 0, risked: risked ?? 0 };

  const confirm = async () => {
    try {
      const result = await placeOrder.mutateAsync({
        pickId: pick.id,
        side: order.side,
        risked: order.risked,
        limitOdds: order.limitOdds,
      });
      setReviewOpen(false);
      setStakeRaw('');
      setTouched(false);
      const status = result.matched >= order.risked ? 'matched' : result.matched > 0 ? 'partially matched' : 'resting';
      toast({
        variant: 'success',
        title: `Order ${status} · ${result.matched} of ${order.risked} pts at ${formatAmerican(result.order.limitOdds)}`,
        body: `${order.side} ${team.abbrev}. ${result.matched} matched; ${result.resting} resting. Track settlement in My Positions. ${formatTimeET(new Date().toISOString())} ET`,
      });
    } catch (err) {
      toast({
        variant: 'error',
        title: 'Order rejected',
        body: err instanceof ApiError ? err.message : 'Something went wrong placing the order.',
      });
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col gap-4 border p-5',
        dark ? 'border-forest-rule bg-[#14251e]' : 'border-parchment bg-cream',
      )}
    >
      <div className="flex items-start justify-between">
        <h3 className={cn('font-serif text-[26px]', text)}>Place an order</h3>
        <p className={cn('label', sub)}>LIMIT</p>
      </div>

      <div className={cn('flex items-center justify-between border p-3', rule)}>
        <p className={cn('text-[13px] font-semibold', text)}>★ {team.city} {team.nickname}</p>
      </div>

      <Segmented
        tone="with-against"
        onDark={dark}
        options={[
          { id: 'WITH', label: 'WITH' },
          { id: 'AGAINST', label: 'AGAINST' },
        ]}
        value={side}
        onChange={setSide}
      />

      <div className="flex gap-3">
        <div className="flex-1">
          <p className={cn('label mb-2', sub)}>LIMIT ODDS</p>
          <Input
            tone={dark ? 'dark' : 'cream'}
            unit="AMER"
            inputMode="numeric"
            value={oddsRaw}
            disabled={disabled}
            onChange={(e) => setOddsRaw(e.target.value)}
            onBlur={() => setTouched(true)}
          />
        </div>
        <div className="flex-1">
          <p className={cn('label mb-2', sub)}>{side === 'WITH' ? 'STAKE' : 'LIABILITY'}</p>
          <Input
            tone={dark ? 'dark' : 'cream'}
            unit="PTS"
            inputMode="numeric"
            value={stakeRaw}
            disabled={disabled}
            placeholder="0"
            onChange={(e) => setStakeRaw(e.target.value)}
            onBlur={() => setTouched(true)}
          />
        </div>
      </div>

      <p className={cn('text-[11px] leading-[1.5]', sub)}>
        {side === 'WITH'
          ? `WITH ${team.nickname} to win. Stake is your maximum loss.`
          : `AGAINST ${team.nickname}. Liability is your maximum loss; you win the backer's stake.`}
      </p>

      {disabled && disabledReason && (
        <p className={cn('border p-3 text-[12px]', rule, sub)}>{disabledReason}</p>
      )}
      {touched && (oErr || sErr) && <p className="text-[12px] text-burgundy">{oErr ?? sErr}</p>}

      <div className={cn('border-t', rule)} />

      {[
        ['Estimated payout', summary ? formatPts(summary.payout) : '—'],
        ['Potential profit', summary ? signedPts(summary.profit) : '—'],
        ['Max loss / liability', summary ? formatPts(summary.maxLoss) : '—'],
        ['Available balance', formatPts(available)],
      ].map(([label, value]) => (
        <div key={label} className="flex items-center gap-3">
          <span className={cn('flex-1 text-[12px]', sub)}>{label}</span>
          <span className={cn('font-mono text-[13px]', label === 'Potential profit' ? (dark ? 'text-mint' : 'text-forest') : text)}>
            {value}
          </span>
        </div>
      ))}

      <Button variant="gold" className="w-full" disabled={!valid} onClick={() => setReviewOpen(true)}>
        Review Order →
      </Button>
      <p className={cn('text-[10px] leading-[1.6]', sub)}>
        Price–time priority. Orders can match in parts. Unmatched stake stays reserved until filled or cancelled.
      </p>

      {valid && (
        <OrderReviewDialog
          open={reviewOpen}
          onBack={() => setReviewOpen(false)}
          onConfirm={() => void confirm()}
          confirming={placeOrder.isPending}
          pick={pick}
          order={order}
          available={available}
        />
      )}
    </div>
  );
}
