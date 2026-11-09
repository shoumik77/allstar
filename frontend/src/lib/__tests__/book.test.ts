import { describe, expect, it } from 'vitest';
import { bestLevel, bookTotals, buildLevels, lastTrade, remainingOf, tapeFor } from '../book';
import type { Match, Order } from '../types';

let seq = 0;
const order = (over: Partial<Order> = {}): Order => ({
  id: `o${++seq}`,
  pickId: 'p1',
  userId: 'u1',
  side: 'WITH',
  risked: 100,
  matched: 0,
  refunded: 0,
  limitOdds: -150,
  status: 'OPEN',
  createdAt: '2026-01-01T00:00:00.000Z',
  ...over,
});

const match = (over: Partial<Match> = {}): Match => ({
  id: `m${++seq}`,
  pickId: 'p1',
  withOrderId: 'w1',
  againstOrderId: 'a1',
  withStake: 50,
  againstLiability: 75,
  odds: -150,
  result: 'PENDING',
  settledAt: null,
  createdAt: '2026-01-02T00:00:00.000Z',
  ...over,
});

describe('remainingOf', () => {
  it('subtracts matched and refunded for open orders', () => {
    expect(remainingOf(order({ risked: 100, matched: 30, refunded: 10, status: 'PARTIAL' }))).toBe(60);
  });

  it('returns 0 for terminal orders', () => {
    expect(remainingOf(order({ status: 'FILLED' }))).toBe(0);
    expect(remainingOf(order({ status: 'CANCELLED' }))).toBe(0);
  });
});

describe('buildLevels', () => {
  it('groups orders at the same limit odds into one level', () => {
    const levels = buildLevels(
      [order({ limitOdds: -150, risked: 100 }), order({ limitOdds: -150, risked: 40 }), order({ limitOdds: -120 })],
      'WITH',
    );
    expect(levels).toHaveLength(2);
    expect(levels[0]).toMatchObject({ odds: -150, remaining: 140, orders: 2 });
  });

  it('orders the WITH column ascending (engine priority for an incoming AGAINST)', () => {
    const levels = buildLevels([order({ limitOdds: -110 }), order({ limitOdds: -200 }), order({ limitOdds: -150 })], 'WITH');
    expect(levels.map((l) => l.odds)).toEqual([-200, -150, -110]);
  });

  it('orders the AGAINST column descending (engine priority for an incoming WITH)', () => {
    const levels = buildLevels(
      [order({ side: 'AGAINST', limitOdds: -110 }), order({ side: 'AGAINST', limitOdds: -200 }), order({ side: 'AGAINST', limitOdds: -150 })],
      'AGAINST',
    );
    expect(levels.map((l) => l.odds)).toEqual([-110, -150, -200]);
  });

  it('computes the cumulative column as a running sum', () => {
    const levels = buildLevels([order({ limitOdds: -200, risked: 10 }), order({ limitOdds: -150, risked: 30 }), order({ limitOdds: -110, risked: 20 })], 'WITH');
    expect(levels.map((l) => l.cumulative)).toEqual([10, 40, 60]);
  });

  it('excludes filled and cancelled orders', () => {
    const levels = buildLevels(
      [order({ limitOdds: -150, status: 'FILLED' }), order({ limitOdds: -150, status: 'CANCELLED' }), order({ limitOdds: -140 })],
      'WITH',
    );
    expect(levels).toHaveLength(1);
    expect(levels[0]!.odds).toBe(-140);
  });

  it('respects maxLevels', () => {
    const levels = buildLevels(
      Array.from({ length: 8 }, (_, i) => order({ limitOdds: -200 + i })),
      'WITH',
      6,
    );
    expect(levels).toHaveLength(6);
  });
});

describe('bookTotals / bestLevel / lastTrade', () => {
  it('totals available depth per side', () => {
    const totals = bookTotals([order({ side: 'WITH', risked: 100 }), order({ side: 'AGAINST', risked: 40, matched: 10 })]);
    expect(totals).toEqual({ withAvailable: 100, againstAvailable: 30 });
  });

  it('bestLevel is the first (best-priority) level', () => {
    const levels = buildLevels([order({ limitOdds: -200 }), order({ limitOdds: -110 })], 'WITH');
    expect(bestLevel(levels)?.odds).toBe(-200);
  });

  it('lastTrade returns the most recent match', () => {
    const older = match({ id: 'm-old', createdAt: '2026-01-01T00:00:00.000Z' });
    const newer = match({ id: 'm-new', createdAt: '2026-01-03T00:00:00.000Z' });
    expect(lastTrade([older, newer])?.id).toBe('m-new');
  });
});

describe('tapeFor', () => {
  it('marks the later-created order as the taker', () => {
    const resting = order({ id: 'rest', side: 'AGAINST', createdAt: '2026-01-01T00:00:00.000Z' });
    const taker = order({ id: 'take', side: 'WITH', createdAt: '2026-01-02T00:00:00.000Z' });
    const rows = tapeFor({
      orders: [resting, taker],
      matches: [match({ withOrderId: 'take', againstOrderId: 'rest' })],
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]!.takerSide).toBe('WITH');
  });
});
