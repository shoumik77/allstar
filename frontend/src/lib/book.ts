import type { Match, Order, OrderSide } from './types';

export type BookLevel = {
  odds: number;
  remaining: number;
  cumulative: number;
  orders: number;
};

export type TapeRow = {
  time: string;
  odds: number;
  withStake: number;
  againstLiability: number;
  takerSide: OrderSide;
};

export function remainingOf(order: Pick<Order, 'risked' | 'matched' | 'refunded' | 'status'>): number {
  if (order.status !== 'OPEN' && order.status !== 'PARTIAL') return 0;
  return order.risked - order.matched - order.refunded;
}

/**
 * Groups resting orders into price levels, ordered by the priority the engine
 * would consume them for an incoming opposite order (mirrors `sortBook`):
 * the WITH column ascending `limitOdds`, the AGAINST column descending.
 */
export function buildLevels(orders: Order[], side: OrderSide, maxLevels = 6): BookLevel[] {
  const groups = new Map<number, { remaining: number; orders: number }>();
  for (const order of orders) {
    if (order.side !== side) continue;
    const remaining = remainingOf(order);
    if (remaining <= 0) continue;
    const group = groups.get(order.limitOdds) ?? { remaining: 0, orders: 0 };
    group.remaining += remaining;
    group.orders += 1;
    groups.set(order.limitOdds, group);
  }

  const sorted = [...groups.entries()].sort((a, b) =>
    side === 'WITH' ? a[0] - b[0] : b[0] - a[0],
  );

  let cumulative = 0;
  return sorted.slice(0, maxLevels).map(([odds, group]) => {
    cumulative += group.remaining;
    return { odds, remaining: group.remaining, cumulative, orders: group.orders };
  });
}

export function bestLevel(levels: BookLevel[]): BookLevel | undefined {
  return levels[0];
}

export function bookTotals(orders: Order[]): { withAvailable: number; againstAvailable: number } {
  let withAvailable = 0;
  let againstAvailable = 0;
  for (const order of orders) {
    const remaining = remainingOf(order);
    if (order.side === 'WITH') withAvailable += remaining;
    else againstAvailable += remaining;
  }
  return { withAvailable, againstAvailable };
}

export function lastTrade(matches: Match[]): Match | undefined {
  return [...matches].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}

/** The `Match` row doesn't record the taker; the order created later was the taker. */
export function tapeFor(pick: { orders: Order[]; matches: Match[] }): TapeRow[] {
  const createdAtByOrder = new Map(pick.orders.map((order) => [order.id, order.createdAt]));
  return [...pick.matches]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((match) => {
      const withCreated = createdAtByOrder.get(match.withOrderId) ?? '';
      const againstCreated = createdAtByOrder.get(match.againstOrderId) ?? '';
      return {
        time: match.createdAt,
        odds: match.odds,
        withStake: match.withStake,
        againstLiability: match.againstLiability,
        takerSide: withCreated >= againstCreated ? 'WITH' : 'AGAINST',
      };
    });
}
