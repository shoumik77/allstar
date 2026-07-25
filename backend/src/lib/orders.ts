import { profitMultiplier } from './odds.js';

export const MIN_RISK = 10;
export const MAX_RISK_BALANCE_FRACTION = 0.25;

export type OrderSideValue = 'WITH' | 'AGAINST';

export function maxRiskFor(availableBalance: number): number {
  return Math.floor(availableBalance * MAX_RISK_BALANCE_FRACTION);
}

/**
 * Every order is priced with American odds expressed on the WITH side, which
 * converts to the backer's profit multiplier `m`.
 *
 * - A WITH order risks its stake and wants the most profit per point: it accepts
 *   any execution with `m >= its limit`.
 * - An AGAINST order risks its liability and covers `liability / m` of backer
 *   stake, so a lower `m` covers more: it accepts any execution with `m <= its limit`.
 *
 * American odds sort in the same order as `m`, so the book can be ordered by
 * `limitOdds` directly in SQL.
 */
export function priceMultiplier(limitOdds: number): number {
  return profitMultiplier(limitOdds);
}

export function isCompatible(incomingSide: OrderSideValue, incomingLimit: number, restingLimit: number): boolean {
  return incomingSide === 'WITH' ? restingLimit >= incomingLimit : restingLimit <= incomingLimit;
}

export type BookOrder = {
  id: string;
  userId: string;
  limitOdds: number;
  /** Unmatched portion of the resting order, in its own risked units. */
  remaining: number;
};

export type Fill = {
  restingOrderId: string;
  odds: number;
  withStake: number;
  againstLiability: number;
};

/**
 * Orders the opposite side of the book the way the incoming order should consume
 * it: best price first, then oldest. The caller supplies orders already
 * restricted to the same pick and to open/partial status.
 */
export function sortBook(incomingSide: OrderSideValue, book: BookOrder[]): BookOrder[] {
  // An incoming WITH wants the highest `m` available; an incoming AGAINST the lowest.
  const direction = incomingSide === 'WITH' ? -1 : 1;
  return [...book].sort((a, b) => {
    if (a.limitOdds !== b.limitOdds) return (a.limitOdds - b.limitOdds) * direction;
    return 0; // callers keep stable insertion order for equal prices (oldest first)
  });
}

/**
 * Amount a single pairing can consume. `m` is the execution multiplier, and both
 * sides are whole points, so the stake is floored and the liability is derived
 * from it (never exceeding what the layer has left).
 */
export function pairAmounts(
  remainingWithStake: number,
  remainingAgainstLiability: number,
  m: number,
): { withStake: number; againstLiability: number } | null {
  const coverableStake = Math.floor(remainingAgainstLiability / m);
  const withStake = Math.min(remainingWithStake, coverableStake);
  if (withStake < 1) return null;

  const againstLiability = Math.min(remainingAgainstLiability, Math.round(withStake * m));
  if (againstLiability < 1) return null;

  return { withStake, againstLiability };
}

/**
 * Pure matching pass: walks the sorted, compatible book and returns the fills an
 * incoming order would produce plus whatever remains to rest on the book.
 * `risked` and the returned `remaining` are in the incoming order's own units
 * (stake for WITH, liability for AGAINST).
 */
export function matchOrder(params: {
  side: OrderSideValue;
  userId: string;
  risked: number;
  limitOdds: number;
  book: BookOrder[];
}): { fills: Fill[]; remaining: number; matched: number } {
  const { side, userId, risked, limitOdds } = params;

  const candidates = sortBook(
    side,
    params.book.filter(
      (o) => o.userId !== userId && o.remaining > 0 && isCompatible(side, limitOdds, o.limitOdds),
    ),
  );

  const fills: Fill[] = [];
  let remaining = risked;

  for (const resting of candidates) {
    if (remaining < 1) break;

    // The maker's price always wins.
    const m = priceMultiplier(resting.limitOdds);

    const pair =
      side === 'WITH'
        ? pairAmounts(remaining, resting.remaining, m)
        : pairAmounts(resting.remaining, remaining, m);
    if (!pair) continue;

    fills.push({
      restingOrderId: resting.id,
      odds: resting.limitOdds,
      withStake: pair.withStake,
      againstLiability: pair.againstLiability,
    });

    remaining -= side === 'WITH' ? pair.withStake : pair.againstLiability;
  }

  return { fills, remaining, matched: risked - remaining };
}

/** Liability a layer must post to fully cover a given backer stake. */
export function liabilityFor(stake: number, limitOdds: number): number {
  return Math.round(stake * priceMultiplier(limitOdds));
}
