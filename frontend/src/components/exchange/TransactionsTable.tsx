import { formatDateShort, signedPts } from '@/lib/format';
import { teamFor } from '@/lib/teams';
import type { Transaction, TransactionType } from '@/lib/types';
import { cn } from '@/lib/utils';

export const TX_LABELS: Record<TransactionType, string> = {
  STAKE: 'Capital reserved',
  REFUND: 'Stake returned',
  PAYOUT: 'Settlement payout',
  ORDER_CANCEL: 'Reservation released',
  UNMATCHED_REFUND: 'Unmatched released at kickoff',
  WEEKLY_RESET: 'Weekly allocation',
  SETTLEMENT_LOSS: 'Settlement loss',
};

export const TX_AFFECTS: Record<TransactionType, string> = {
  STAKE: 'Available only',
  REFUND: 'Available only',
  ORDER_CANCEL: 'Available only',
  UNMATCHED_REFUND: 'Available only',
  PAYOUT: 'Total capital',
  SETTLEMENT_LOSS: 'Total capital',
  WEEKLY_RESET: 'Total capital',
};

export const TX_STATUS: Record<TransactionType, string> = {
  STAKE: 'Reserved',
  REFUND: 'Released',
  ORDER_CANCEL: 'Released',
  UNMATCHED_REFUND: 'Released',
  PAYOUT: 'Settled',
  SETTLEMENT_LOSS: 'Settled',
  WEEKLY_RESET: 'Completed',
};

export function txReference(tx: Transaction): string {
  if (tx.pick?.game) {
    const away = teamFor(tx.pick.game.awayTeam).abbrev;
    const home = teamFor(tx.pick.game.homeTeam).abbrev;
    const team = teamFor(tx.pick.side === 'HOME' ? tx.pick.game.homeTeam : tx.pick.game.awayTeam).abbrev;
    const side = tx.order?.side ? ` ${tx.order.side}` : '';
    return `${away} @ ${home} · ${team}${side}`;
  }
  return TX_LABELS[tx.type];
}

export function transactionCsvRows(items: Transaction[]): (string | number)[][] {
  return items.map((t) => [
    t.createdAt,
    txReference(t),
    TX_LABELS[t.type],
    t.amount,
    TX_AFFECTS[t.type],
    TX_STATUS[t.type],
  ]);
}

export const TX_CSV_HEADERS = ['DATE', 'REFERENCE', 'TYPE', 'AMOUNT', 'AFFECTS', 'STATUS'];

export function TransactionsTable({ items, mobileCards }: { items: Transaction[]; mobileCards?: boolean }) {
  if (mobileCards) {
    return (
      <>
        {items.map((t) => (
          <div key={t.id} className="flex flex-col gap-1.5 border border-parchment p-4">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-semibold">{TX_LABELS[t.type]}</p>
              <span className={cn('font-mono text-[13px]', t.amount >= 0 ? 'text-forest' : 'text-burgundy')}>
                {signedPts(t.amount)}
              </span>
            </div>
            <p className="text-[12px] text-muted">{txReference(t)}</p>
            <p className="font-mono text-[11px] text-muted">
              {formatDateShort(t.createdAt)} · {TX_AFFECTS[t.type]} · {TX_STATUS[t.type]}
            </p>
          </div>
        ))}
      </>
    );
  }

  return (
    <table className="w-full border-collapse text-left">
      <thead>
        <tr className="border-b border-parchment">
          {['DATE / TIME ET', 'REFERENCE', 'TYPE', 'AMOUNT', 'AFFECTS', 'STATUS'].map((h) => (
            <th key={h} className="label font-normal text-muted">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {items.map((t) => (
          <tr key={t.id} className="min-h-[58px] border-b border-parchment text-[12px]">
            <td className="numeral py-3 pr-3">{formatDateShort(t.createdAt)}</td>
            <td className="py-3 pr-3">{txReference(t)}</td>
            <td className="py-3 pr-3">{TX_LABELS[t.type]}</td>
            <td className={cn('numeral py-3 pr-3', t.amount >= 0 ? 'text-forest' : 'text-burgundy')}>
              {signedPts(t.amount)}
            </td>
            <td className="py-3 pr-3 text-muted">{TX_AFFECTS[t.type]}</td>
            <td className="py-3 pr-3">{TX_STATUS[t.type]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
