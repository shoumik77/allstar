import { describe, expect, it } from 'vitest';
import { summarizePositions } from '../positions';
import type { MatchResult, MyOrder, OrderSide } from '../types';

let seq = 0;

const matchLite = (over: { withStake?: number; againstLiability?: number; odds?: number; result?: MatchResult }) => ({
  id: `m${++seq}`,
  withStake: over.withStake ?? 100,
  againstLiability: over.againstLiability ?? 67,
  odds: over.odds ?? -150,
  result: over.result ?? 'PENDING',
});

const myOrder = (over: { side?: OrderSide; status?: MyOrder['status']; risked?: number; matched?: number; refunded?: number; withMatches?: MyOrder['withMatches']; againstMatches?: MyOrder['againstMatches'] }): MyOrder =>
  ({
    id: `o${++seq}`,
    pickId: 'p1',
    userId: 'u1',
    side: over.side ?? 'WITH',
    risked: over.risked ?? 100,
    matched: over.matched ?? 0,
    refunded: over.refunded ?? 0,
    limitOdds: -150,
    status: over.status ?? 'FILLED',
    createdAt: '2026-01-01T00:00:00.000Z',
    pick: { id: 'p1' },
    withMatches: over.withMatches ?? [],
    againstMatches: over.againstMatches ?? [],
  }) as unknown as MyOrder;

describe('summarizePositions', () => {
  it('WITH win: realized = +counterparty liability, status WON', () => {
    const [summary] = summarizePositions([
      myOrder({ side: 'WITH', withMatches: [matchLite({ withStake: 100, againstLiability: 67, result: 'WITH_WON' })] }),
    ]);
    expect(summary).toMatchObject({ side: 'WITH', matchedStake: 100, realized: 67, status: 'WON', settledExposure: 100, maxLoss: 0 });
  });

  it('AGAINST win: realized = +with stake', () => {
    const [summary] = summarizePositions([
      myOrder({ side: 'AGAINST', againstMatches: [matchLite({ withStake: 100, againstLiability: 67, result: 'AGAINST_WON' })] }),
    ]);
    expect(summary).toMatchObject({ side: 'AGAINST', matchedStake: 67, realized: 100, status: 'WON', settledExposure: 67 });
  });

  it('loss: realized = −own amount', () => {
    const [summary] = summarizePositions([
      myOrder({ side: 'WITH', withMatches: [matchLite({ withStake: 100, againstLiability: 67, result: 'AGAINST_WON' })] }),
    ]);
    expect(summary).toMatchObject({ realized: -100, status: 'LOST', settledExposure: 100 });
  });

  it('push: realized = 0', () => {
    const [summary] = summarizePositions([
      myOrder({ side: 'WITH', withMatches: [matchLite({ result: 'PUSH' })] }),
    ]);
    expect(summary).toMatchObject({ realized: 0, status: 'PUSH', settledExposure: 0 });
  });

  it('mixed results produce MIXED', () => {
    const [summary] = summarizePositions([
      myOrder({
        side: 'WITH',
        withMatches: [matchLite({ result: 'WITH_WON' }), matchLite({ result: 'AGAINST_WON' })],
      }),
    ]);
    expect(summary!.status).toBe('MIXED');
  });

  it('pending matches expose profit/loss and weighted avg odds', () => {
    const [summary] = summarizePositions([
      myOrder({
        side: 'WITH',
        status: 'PARTIAL',
        risked: 150,
        matched: 120,
        withMatches: [
          matchLite({ withStake: 100, againstLiability: 67, odds: -150 }),
          matchLite({ withStake: 20, againstLiability: 20, odds: 100 }),
        ],
      }),
    ]);
    expect(summary!.matchedStake).toBe(120);
    expect(summary!.avgOdds).toBe(Math.round((-150 * 100 + 100 * 20) / 120));
    expect(summary!.maxLoss).toBe(120);
    expect(summary!.settledExposure).toBe(0);
    expect(summary!.potentialProfit).toBe(87);
    expect(summary!.status).toBe('PENDING');
    expect(summary!.unmatched).toBe(30);
  });

  it('mixed positions split pending and settled exposure', () => {
    const [summary] = summarizePositions([
      myOrder({
        side: 'WITH',
        withMatches: [
          matchLite({ withStake: 100, result: 'WITH_WON' }),
          matchLite({ withStake: 40, result: 'PENDING' }),
          matchLite({ withStake: 25, result: 'PUSH' }),
        ],
      }),
    ]);
    expect(summary!.maxLoss).toBe(40);
    expect(summary!.settledExposure).toBe(100);
    expect(summary!.status).toBe('MIXED');
  });

  it('groups separate sides into separate positions', () => {
    const summaries = summarizePositions([myOrder({ side: 'WITH' }), myOrder({ side: 'AGAINST' })]);
    expect(summaries).toHaveLength(2);
  });
});
