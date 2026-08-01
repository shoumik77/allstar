import type { Prisma } from '@prisma/client';
import { prisma } from '../prisma.js';
import { releaseOrderRemainder } from './matching.js';

async function sweepGameInTx(
  tx: Prisma.TransactionClient,
  gameId: string,
): Promise<{ lockedPicks: number; voidedPicks: number }> {
  const game = await tx.game.findUnique({ where: { id: gameId } });
  if (!game) throw new Error('Game not found');
  if (game.status !== 'SCHEDULED' && game.status !== 'IN_PROGRESS') {
    return { lockedPicks: 0, voidedPicks: 0 };
  }

  await tx.game.update({ where: { id: gameId }, data: { status: 'IN_PROGRESS' } });

  const picks = await tx.pick.findMany({
    where: { gameId, status: 'OPEN' },
    include: { orders: true, matches: true },
  });

  let lockedPicks = 0;
  let voidedPicks = 0;

  for (const pick of picks) {
    for (const order of pick.orders) {
      if (order.status === 'OPEN' || order.status === 'PARTIAL') {
        await releaseOrderRemainder(tx, order.id, 'UNMATCHED_REFUND');
      }
    }

    if (pick.matches.length === 0) {
      await tx.pick.update({ where: { id: pick.id }, data: { status: 'VOID' } });
      voidedPicks += 1;
    } else {
      await tx.pick.update({ where: { id: pick.id }, data: { status: 'LOCKED' } });
      lockedPicks += 1;
    }
  }

  return { lockedPicks, voidedPicks };
}

/**
 * Locks all picks at kickoff, cancels/rests any unmatched order remainders,
 * and voids picks that never matched. Called by the cron job or admin endpoint.
 */
export async function sweepGame(gameId: string): Promise<{ lockedPicks: number; voidedPicks: number }> {
  return prisma.$transaction(async (tx) => sweepGameInTx(tx, gameId));
}

export async function sweepGameAsPartOfWeek(
  tx: Prisma.TransactionClient,
  gameId: string,
): Promise<{ lockedPicks: number; voidedPicks: number }> {
  return sweepGameInTx(tx, gameId);
}

/** Sweeps every game whose kickoff is in the past but still marked SCHEDULED. */
export async function sweepAllKickoffs(): Promise<Array<{ gameId: string; lockedPicks: number; voidedPicks: number }>> {
  const games = await prisma.game.findMany({
    where: { status: 'SCHEDULED', kickoff: { lte: new Date() } },
  });

  const results = [];
  for (const game of games) {
    const result = await sweepGame(game.id);
    results.push({ gameId: game.id, ...result });
  }
  return results;
}
