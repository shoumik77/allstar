import { formatAmerican, formatPts, profitMultiplier, signedPts } from '@/lib/format';
import { teamFor } from '@/lib/teams';
import type { GamePick, OrderSide } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { TeamMark } from './TeamMark';

export type ReviewOrder = {
  side: OrderSide;
  limitOdds: number;
  risked: number;
};

export function OrderReviewDialog({
  open,
  onBack,
  onConfirm,
  confirming,
  pick,
  order,
  available,
}: {
  open: boolean;
  onBack: () => void;
  onConfirm: () => void;
  confirming?: boolean;
  pick: GamePick;
  order: ReviewOrder;
  available: number;
}) {
  const team = teamFor(pick.side === 'HOME' ? pick.game.homeTeam : pick.game.awayTeam);
  const m = profitMultiplier(order.limitOdds);
  const profit = order.side === 'WITH' ? Math.round(order.risked * m) : Math.floor(order.risked / m);
  const payout = order.risked + profit;
  const stakeLabel = order.side === 'WITH' ? 'Stake' : 'Liability';

  return (
    <Dialog open={open} onClose={onBack} labelledBy="order-review-title">
      <div className="flex items-start justify-between">
        <p className="label text-forest">ORDER REVIEW</p>
        <button onClick={onBack} aria-label="Close" className="text-[20px] leading-none text-muted hover:text-ink">
          ×
        </button>
      </div>
      <h3 id="order-review-title" className="mt-2 font-serif text-[40px] leading-[1.05]">
        Back your conviction.
      </h3>

      <div className="mt-4 flex items-center gap-4 border-y border-parchment py-3.5">
        <TeamMark team={pick.side === 'HOME' ? pick.game.homeTeam : pick.game.awayTeam} size={48} />
        <div>
          <p className="text-[15px] font-semibold">{team.city} {team.nickname}</p>
          <p className="font-condensed text-[13px] uppercase tracking-[0.02em] text-forest">
            {order.side} · {pick.type} · {team.abbrev}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2.5">
        {[
          ['Limit odds', formatAmerican(order.limitOdds)],
          [stakeLabel, formatPts(order.risked)],
          [`Estimated payout if ${team.abbrev} wins`, formatPts(payout)],
          ['Potential profit', signedPts(profit)],
          [`Maximum loss / liability`, formatPts(order.risked)],
        ].map(([label, value], i) => (
          <div key={label} className="flex items-center gap-3">
            <span className="flex-1 text-[12px] text-muted">{label}</span>
            <span className={`font-mono text-[13px] ${i === 3 ? 'text-forest' : 'text-ink'}`}>{value}</span>
          </div>
        ))}
        <div className="border-t border-parchment" />
        <div className="flex items-center gap-3">
          <span className="flex-1 text-[12px] text-muted">Available after reservation</span>
          <span className="font-mono text-[13px] text-ink">{formatPts(available - order.risked)}</span>
        </div>
      </div>

      <div className="mt-5 bg-parchment p-3.5">
        <p className="text-[12px] font-semibold">A limit is a price, not a promise.</p>
        <p className="mt-1.5 text-[11px] leading-[1.6] text-muted">
          Your order matches at {formatAmerican(order.limitOdds)} or better. If the book never reaches your price,
          the unmatched remainder stays reserved until you cancel it.
        </p>
      </div>

      <div className="mt-5 flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={onBack} disabled={confirming}>
          Back
        </Button>
        <Button variant="primary" className="flex-1" onClick={onConfirm} disabled={confirming}>
          {confirming ? 'Placing…' : 'Confirm Order'}
        </Button>
      </div>
      <p className="mt-4 text-center font-condensed text-[11px] uppercase tracking-[0.02em] text-burgundy">
        SIMULATED FUNDS ONLY
      </p>
    </Dialog>
  );
}
