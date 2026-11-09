import { describe, expect, it } from 'vitest';
import { ledgerTiles, realizedSeries, toCsv } from '../ledger';
import type { MeResponse, MyOrder, Transaction } from '../types';

const tx = (type: Transaction['type'], amount: number, createdAt: string): Transaction => ({
  id: `t-${type}-${createdAt}`,
  userId: 'u1',
  weekId: 'w1',
  type,
  amount,
  note: null,
  createdAt,
});

describe('realizedSeries', () => {
  it('builds a cumulative series over PAYOUT and SETTLEMENT_LOSS, ascending', () => {
    const series = realizedSeries([
      tx('PAYOUT', 67, '2026-01-03T00:00:00.000Z'),
      tx('SETTLEMENT_LOSS', -50, '2026-01-01T00:00:00.000Z'),
      tx('STAKE', -100, '2026-01-02T00:00:00.000Z'),
      tx('PAYOUT', 20, '2026-01-04T00:00:00.000Z'),
    ]);
    expect(series.map((p) => p.cumulative)).toEqual([-50, 17, 37]);
  });
});

describe('ledgerTiles', () => {
  it('splits locked into matched and unmatched', () => {
    const me = { balance: { available: 800, locked: 200, total: 1000 } } as MeResponse;
    const orders = [
      { risked: 100, matched: 60, refunded: 0, status: 'PARTIAL' },
      { risked: 80, matched: 80, refunded: 0, status: 'FILLED' },
    ] as MyOrder[];
    const tiles = ledgerTiles(me, orders);
    expect(tiles).toEqual({ total: 1000, available: 800, committed: 200, matched: 160, unmatched: 40 });
  });
});

describe('toCsv', () => {
  it('quotes fields containing commas or quotes', () => {
    const csv = toCsv(['a', 'b'], [['x,y', 'say "hi"'], ['plain', 42]]);
    expect(csv).toBe('a,b\n"x,y","say ""hi"""\nplain,42');
  });
});
