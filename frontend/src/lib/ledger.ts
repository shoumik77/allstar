import { remainingOf } from './book';
import type { MeResponse, MyOrder, Transaction } from './types';

export type PnlPoint = { t: Date; cumulative: number };

export function realizedSeries(transactions: Transaction[]): PnlPoint[] {
  const realized = transactions
    .filter((t) => t.type === 'PAYOUT' || t.type === 'SETTLEMENT_LOSS')
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  let cumulative = 0;
  return realized.map((t) => {
    cumulative += t.amount;
    return { t: new Date(t.createdAt), cumulative };
  });
}

export type LedgerTiles = {
  total: number;
  available: number;
  committed: number;
  matched: number;
  unmatched: number;
};

export function ledgerTiles(me: MeResponse, orders: MyOrder[]): LedgerTiles {
  const unmatched = orders.reduce((sum, order) => sum + remainingOf(order), 0);
  return {
    total: me.balance.total,
    available: me.balance.available,
    committed: me.balance.locked,
    matched: me.balance.locked - unmatched,
    unmatched,
  };
}

function csvField(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(headers: string[], rows: (string | number)[][]): string {
  const lines = [headers.map(csvField).join(',')];
  for (const row of rows) {
    lines.push(row.map(csvField).join(','));
  }
  return lines.join('\n');
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
