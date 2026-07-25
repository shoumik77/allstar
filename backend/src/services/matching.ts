import { Prisma } from '@prisma/client';
import type { Order, OrderSide, Pick } from '@prisma/client';
import { prisma } from '../prisma.js';
import { badRequest, notFound } from '../lib/errors.js';
import { MIN_RISK, matchOrder, maxRiskFor, type BookOrder, type Fill } from '../lib/orders.js';
import { ensureWeeklyBalance } from './weeks.js';

export type PlaceOrderInput = {
  side: OrderSide;
  risked: number;
  /** Defaults to the pick's snapshotted price for the chosen side. */
  limitOdds?: number;
};

export type PlaceOrderResult = {
  order: Order;
  fills: Fill[];
  matched: number;
  resting: number;
};

/** The pick's snapshot expressed as WITH-side American odds. */
export function defaultLimitFor(pick: Pick): number {
  return pick.sideOdds;
}

export function assertRiskAllowed(risked: number, availableBalance: number): void {
  if (!Number.isInteger(risked)) throw badRequest('Risk must be a whole number of points', 'invalid_risk');
  if (risked < MIN_RISK) throw badRequest(`Minimum risk is ${MIN_RISK} points`, 'risk_below_min');
  if (risked > availableBalance) throw badRequest('Insufficient balance', 'insufficient_balance');

  const cap = maxRiskFor(availableBalance);
  if (risked > cap) {
    throw badRequest(`Max risk is 25% of your balance (${cap} points)`, 'risk_above_max');
  }
}

/**
 * Locks every open order on the opposite side of the book for the duration of the
 * transaction. Concurrent takers serialize here, so a resting order can only be
 * consumed once.
 */
async function lockOppositeBook(
  tx: Prisma.TransactionClient,
  pickId: string,
  incomingSide: OrderSide,
): Promise<BookOrder[]> {
  const oppositeSide: OrderSide = incomingSide === 'WITH' ? 'AGAINST' : 'WITH';

  const rows = await tx.$queryRaw<Array<{ id: string; userId: string; limitOdds: number; remaining: number }>>(
    Prisma.sql`
      SELECT "id", "userId", "limitOdds", ("risked" - "matched" - "refunded") AS "remaining"
      FROM "Order"
      WHERE "pickId" = ${pickId}
        AND "side" = ${oppositeSide}::"OrderSide"
        AND "status" IN ('OPEN', 'PARTIAL')
        AND ("risked" - "matched" - "refunded") > 0
      ORDER BY "createdAt" ASC
      FOR UPDATE
    `,
  );

  return rows.map((row) => ({ ...row, remaining: Number(row.remaining) }));
}

function statusFor(risked: number, matched: number, refunded: number): 'OPEN' | 'PARTIAL' | 'FILLED' {
  if (matched >= risked) return 'FILLED';
  if (matched > 0 || refunded > 0) return 'PARTIAL';
  return 'OPEN';
}

export async function placeOrder(
  userId: string,
  pickId: string,
  input: PlaceOrderInput,
  client: Prisma.TransactionClient | typeof prisma = prisma,
): Promise<PlaceOrderResult> {
  const run = async (tx: Prisma.TransactionClient): Promise<PlaceOrderResult> => {
    const pick = await tx.pick.findUnique({ where: { id: pickId }, include: { game: true } });
    if (!pick) throw notFound('Pick not found', 'pick_not_found');

    if (pick.status === 'VOID' || pick.status === 'SETTLED') {
      throw badRequest('This pick is no longer open', 'pick_closed');
    }
    if (pick.game.kickoff <= new Date() || pick.game.status !== 'SCHEDULED') {
      if (pick.status === 'OPEN') {
        await tx.pick.update({ where: { id: pick.id }, data: { status: 'LOCKED' } });
      }
      throw badRequest('This pick locked at kickoff', 'pick_locked');
    }

    const balance = await ensureWeeklyBalance(userId, pick.game.weekId, tx);
    assertRiskAllowed(input.risked, balance.balance);

    const limitOdds = input.limitOdds ?? defaultLimitFor(pick);

    // Reserve the full risked amount up front; matching only decides how much of
    // it ends up working.
    const order = await tx.order.create({
      data: { pickId: pick.id, userId, side: input.side, risked: input.risked, limitOdds },
    });

    await tx.weeklyBalance.update({
      where: { userId_weekId: { userId, weekId: pick.game.weekId } },
      data: { balance: { decrement: input.risked }, locked: { increment: input.risked } },
    });

    await tx.transaction.create({
      data: {
        userId,
        weekId: pick.game.weekId,
        type: 'STAKE',
        amount: -input.risked,
        pickId: pick.id,
        orderId: order.id,
      },
    });

    const book = await lockOppositeBook(tx, pick.id, input.side);
    const { fills, matched, remaining } = matchOrder({
      side: input.side,
      userId,
      risked: input.risked,
      limitOdds,
      book,
    });

    for (const fill of fills) {
      const restingConsumed = input.side === 'WITH' ? fill.againstLiability : fill.withStake;
      const resting = await tx.order.update({
        where: { id: fill.restingOrderId },
        data: { matched: { increment: restingConsumed } },
      });
      await tx.order.update({
        where: { id: resting.id },
        data: { status: statusFor(resting.risked, resting.matched, resting.refunded) },
      });

      await tx.match.create({
        data: {
          pickId: pick.id,
          withOrderId: input.side === 'WITH' ? order.id : fill.restingOrderId,
          againstOrderId: input.side === 'WITH' ? fill.restingOrderId : order.id,
          withStake: fill.withStake,
          againstLiability: fill.againstLiability,
          odds: fill.odds,
        },
      });
    }

    const updated = await tx.order.update({
      where: { id: order.id },
      data: { matched, status: statusFor(input.risked, matched, 0) },
    });

    return { order: updated, fills, matched, resting: remaining };
  };

  // Reuse an outer transaction when one is supplied (pick creation does this).
  return '$transaction' in client ? client.$transaction(run) : run(client as Prisma.TransactionClient);
}

/** Releases the unmatched remainder of an order back to the user's balance. */
export async function releaseOrderRemainder(
  tx: Prisma.TransactionClient,
  orderId: string,
  reason: 'ORDER_CANCEL' | 'UNMATCHED_REFUND',
): Promise<number> {
  const order = await tx.order.findUnique({ where: { id: orderId }, include: { pick: { include: { game: true } } } });
  if (!order) throw notFound('Order not found', 'order_not_found');

  const remainder = order.risked - order.matched - order.refunded;
  if (remainder <= 0) return 0;

  await tx.order.update({
    where: { id: order.id },
    data: {
      refunded: { increment: remainder },
      status: order.matched > 0 ? 'FILLED' : 'CANCELLED',
    },
  });

  await tx.weeklyBalance.update({
    where: { userId_weekId: { userId: order.userId, weekId: order.pick.game.weekId } },
    data: { balance: { increment: remainder }, locked: { decrement: remainder } },
  });

  await tx.transaction.create({
    data: {
      userId: order.userId,
      weekId: order.pick.game.weekId,
      type: reason,
      amount: remainder,
      pickId: order.pickId,
      orderId: order.id,
    },
  });

  return remainder;
}

export async function cancelOrder(userId: string, orderId: string): Promise<{ refunded: number }> {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { pick: { include: { game: true } } } });
    if (!order) throw notFound('Order not found', 'order_not_found');
    if (order.userId !== userId) throw notFound('Order not found', 'order_not_found');
    if (order.status === 'CANCELLED') throw badRequest('Order already cancelled', 'order_cancelled');
    if (order.pick.game.kickoff <= new Date()) throw badRequest('This pick locked at kickoff', 'pick_locked');

    const remainder = order.risked - order.matched - order.refunded;
    if (remainder <= 0) throw badRequest('Order is fully matched', 'order_filled');

    const refunded = await releaseOrderRemainder(tx, order.id, 'ORDER_CANCEL');
    return { refunded };
  });
}
