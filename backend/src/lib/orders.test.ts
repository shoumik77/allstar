import { describe, expect, it } from 'vitest';
import {
  isCompatible,
  liabilityFor,
  matchOrder,
  maxRiskFor,
  pairAmounts,
  priceMultiplier,
  sortBook,
  type BookOrder,
} from './orders.js';

const book = (orders: Array<Partial<BookOrder> & { id: string }>): BookOrder[] =>
  orders.map((o) => ({ userId: 'other', limitOdds: -150, remaining: 100, ...o }));

describe('priceMultiplier', () => {
  it('converts American odds to backer profit per point', () => {
    expect(priceMultiplier(-150)).toBeCloseTo(0.6667, 4);
    expect(priceMultiplier(150)).toBe(1.5);
    expect(priceMultiplier(-110)).toBeCloseTo(0.9091, 4);
  });
});

describe('isCompatible', () => {
  it('lets a backer take any price at or above its limit', () => {
    expect(isCompatible('WITH', -150, -150)).toBe(true);
    expect(isCompatible('WITH', -150, 120)).toBe(true);
    expect(isCompatible('WITH', -150, -200)).toBe(false);
  });

  it('lets a layer take any price at or below its limit', () => {
    expect(isCompatible('AGAINST', -150, -150)).toBe(true);
    expect(isCompatible('AGAINST', -150, -200)).toBe(true);
    expect(isCompatible('AGAINST', -150, 120)).toBe(false);
  });
});

describe('pairAmounts', () => {
  it('caps the backer stake by what the layer can cover', () => {
    // At -150 a layer risking 60 covers 90 of backer stake.
    expect(pairAmounts(150, 60, priceMultiplier(-150))).toEqual({ withStake: 90, againstLiability: 60 });
  });

  it('caps the layer liability by the backer stake on offer', () => {
    expect(pairAmounts(30, 500, priceMultiplier(-150))).toEqual({ withStake: 30, againstLiability: 20 });
  });

  it('returns null when the remainder is dust', () => {
    expect(pairAmounts(150, 0, priceMultiplier(-150))).toBeNull();
    expect(pairAmounts(0, 60, priceMultiplier(-150))).toBeNull();
  });

  it('never lets liability exceed what the layer has left', () => {
    const pair = pairAmounts(1000, 61, priceMultiplier(-150));
    expect(pair!.againstLiability).toBeLessThanOrEqual(61);
  });
});

describe('sortBook', () => {
  it('gives a backer the highest price first, oldest first on ties', () => {
    const sorted = sortBook(
      'WITH',
      book([
        { id: 'a', limitOdds: -200 },
        { id: 'b', limitOdds: 120 },
        { id: 'c', limitOdds: -150 },
        { id: 'd', limitOdds: 120 },
      ]),
    );
    expect(sorted.map((o) => o.id)).toEqual(['b', 'd', 'c', 'a']);
  });

  it('gives a layer the lowest price first', () => {
    const sorted = sortBook(
      'AGAINST',
      book([
        { id: 'a', limitOdds: -200 },
        { id: 'b', limitOdds: 120 },
        { id: 'c', limitOdds: -150 },
      ]),
    );
    expect(sorted.map((o) => o.id)).toEqual(['a', 'c', 'b']);
  });
});

describe('matchOrder', () => {
  it('fills a backer against a resting layer at the maker price', () => {
    const result = matchOrder({
      side: 'WITH',
      userId: 'alice',
      risked: 150,
      limitOdds: -150,
      book: book([{ id: 'bob', userId: 'bob', limitOdds: -150, remaining: 60 }]),
    });

    expect(result.fills).toEqual([
      { restingOrderId: 'bob', odds: -150, withStake: 90, againstLiability: 60 },
    ]);
    expect(result.matched).toBe(90);
    expect(result.remaining).toBe(60);
  });

  it('rests entirely when the book is empty', () => {
    const result = matchOrder({ side: 'WITH', userId: 'alice', risked: 150, limitOdds: -150, book: [] });
    expect(result.fills).toEqual([]);
    expect(result.remaining).toBe(150);
  });

  it('never matches a user against their own order', () => {
    const result = matchOrder({
      side: 'WITH',
      userId: 'alice',
      risked: 150,
      limitOdds: -150,
      book: book([{ id: 'own', userId: 'alice', remaining: 100 }]),
    });
    expect(result.fills).toEqual([]);
    expect(result.remaining).toBe(150);
  });

  it('skips incompatible prices and rests the remainder', () => {
    const result = matchOrder({
      side: 'WITH',
      userId: 'alice',
      risked: 100,
      limitOdds: 120, // wants +120 or better
      book: book([{ id: 'cheap', userId: 'bob', limitOdds: -150, remaining: 500 }]),
    });
    expect(result.fills).toEqual([]);
    expect(result.remaining).toBe(100);
  });

  it('walks multiple makers best price first', () => {
    const result = matchOrder({
      side: 'WITH',
      userId: 'alice',
      risked: 200,
      limitOdds: -200,
      book: book([
        { id: 'worse', userId: 'bob', limitOdds: -200, remaining: 100 },
        { id: 'better', userId: 'carol', limitOdds: 100, remaining: 50 },
      ]),
    });

    // Carol's +100 is the better price for a backer, so it fills first.
    expect(result.fills[0]).toMatchObject({ restingOrderId: 'better', odds: 100, withStake: 50, againstLiability: 50 });
    expect(result.fills[1]).toMatchObject({ restingOrderId: 'worse', odds: -200, withStake: 150 });
    expect(result.remaining).toBe(0);
  });

  it('fills an incoming layer against resting backers', () => {
    const result = matchOrder({
      side: 'AGAINST',
      userId: 'bob',
      risked: 60,
      limitOdds: -150,
      book: book([{ id: 'alice', userId: 'alice', limitOdds: -150, remaining: 150 }]),
    });

    expect(result.fills).toEqual([
      { restingOrderId: 'alice', odds: -150, withStake: 90, againstLiability: 60 },
    ]);
    expect(result.remaining).toBe(0);
  });

  it('conserves points across a full fill', () => {
    const result = matchOrder({
      side: 'AGAINST',
      userId: 'bob',
      risked: 100,
      limitOdds: -150,
      book: book([
        { id: 'a1', userId: 'alice', limitOdds: -150, remaining: 90 },
        { id: 'a2', userId: 'carol', limitOdds: -150, remaining: 90 },
      ]),
    });

    const totalLiability = result.fills.reduce((sum, f) => sum + f.againstLiability, 0);
    expect(totalLiability).toBe(result.matched);
    expect(totalLiability).toBeLessThanOrEqual(100);
  });
});

describe('stake limits', () => {
  it('caps risk at 25% of balance', () => {
    expect(maxRiskFor(1000)).toBe(250);
    expect(maxRiskFor(999)).toBe(249);
  });
});

describe('liabilityFor', () => {
  it('prices a layer covering a backer stake', () => {
    expect(liabilityFor(150, -150)).toBe(100);
    expect(liabilityFor(100, 150)).toBe(150);
  });
});
