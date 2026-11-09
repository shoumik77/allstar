import { formatAmerican } from '@/lib/format';
import { remainingOf } from '@/lib/book';
import { teamFor } from '@/lib/teams';
import type { GamePick, Order } from '@/lib/types';
import { StatusDot } from '@/components/ui/status-dot';

export function PartialFillRow({
  order,
  pick,
  onCancel,
  cancelling,
}: {
  order: Order;
  pick: GamePick;
  onCancel: (orderId: string) => void;
  cancelling?: boolean;
}) {
  const team = teamFor(pick.side === 'HOME' ? pick.game.homeTeam : pick.game.awayTeam);
  const remaining = remainingOf(order);
  const matchedPct = order.risked > 0 ? Math.min(100, (order.matched / order.risked) * 100) : 0;

  return (
    <div className="flex flex-col gap-3 border border-forest-rule p-4">
      <div className="flex items-start justify-between">
        <p className="font-mono text-[12px] text-cream">
          {team.abbrev} · {order.side} · {formatAmerican(order.limitOdds)}
        </p>
        <StatusDot state="partial" label={order.matched > 0 ? 'PARTIALLY MATCHED' : 'RESTING'} />
      </div>
      <div className="flex h-[3px]">
        <div className="bg-gold" style={{ width: `${matchedPct}%` }} />
        <div className="flex-1 bg-forest-rule" />
      </div>
      <div className="flex items-center justify-between text-[11px]">
        <p className="font-mono text-parchment">
          {order.matched.toLocaleString()} / {order.risked.toLocaleString()} matched · {remaining.toLocaleString()} remaining
        </p>
        {remaining > 0 && (
          <button
            onClick={() => onCancel(order.id)}
            disabled={cancelling}
            className="text-rose hover:underline disabled:opacity-40"
          >
            Cancel remainder
          </button>
        )}
      </div>
    </div>
  );
}
