import type { Game, Match, Pick } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { prisma } from '../prisma.js';
import { badRequest } from '../lib/errors.js';

export function determineMatchResult(pick: Pick, game: Game): 'WITH_WON' | 'AGAINST_WON' | 'PUSH' {
  if (game.status !== 'FINAL' || game.homeScore === null || game.awayScore === null) {
    throw badRequest('Game is not final', 'game_not_final');
  }

  const homeMargin = game.homeScore - game.awayScore;

  if (pick.type === 'MONEYLINE') {
    if (homeMargin === 0) return 'PUSH';
    const homeWon = homeMargin > 0;
    const withWon = pick.side === 'HOME' ? homeWon : !homeWon;
    return withWon ? 'WITH_WON' : 'AGAINST_WON';
  }

  // Spread: `line` is the pick-side line at snapshot; chosen side covers if its
  // margin is strictly greater than the line. Equal margin to line is a push.
  const sideMargin = pick.side === 'HOME' ? homeMargin : -homeMargin;
  if (pick.line === null) throw badRequest('Spread line missing', 'line_missing');
  if (sideMargin > pick.line) return 'WITH_WON';
  if (sideMargin < pick.line) return 'AGAINST_WON';
  return 'PUSH';
}

async function creditPayout(
  tx: Prisma.TransactionClient,
  userId: string,
  weekId: string,
  match: Match,
  orderId: string,
  amount: number,
) {
  await tx.weeklyBalance.update({
    where: { userId_weekId: { userId, weekId } },
    data: { balance: { increment: amount } },
  });

  await tx.transaction.create({
    data: {
      userId,
      weekId,
      type: 'PAYOUT',
      amount,
      pickId: match.pickId,
      matchId: match.id,
      orderId,
    },
  });
}

async function releaseLocked(
  tx: Prisma.TransactionClient,
  userId: string,
  weekId: string,
  match: Match,
  orderId: string,
  amount: number,
) {
  await tx.weeklyBalance.update({
    where: { userId_weekId: { userId, weekId } },
    data: { balance: { increment: amount }, locked: { decrement: amount } },
  });

  await tx.transaction.create({
    data: {
      userId,
      weekId,
      type: 'REFUND',
      amount,
      pickId: match.pickId,
      matchId: match.id,
      orderId,
    },
  });
}

async function recordLoss(
  tx: Prisma.TransactionClient,
  userId: string,
  weekId: string,
  match: Match,
  orderId: string,
  amount: number,
) {
  await tx.weeklyBalance.update({
    where: { userId_weekId: { userId, weekId } },
    data: { locked: { decrement: amount } },
  });

  await tx.transaction.create({
    data: {
      userId,
      weekId,
      type: 'SETTLEMENT_LOSS',
      amount: -amount,
      pickId: match.pickId,
      matchId: match.id,
      orderId,
    },
  });
}

async function settleGameInTx(
  tx: Prisma.TransactionClient,
  gameId: string,
): Promise<void> {
  const game = await tx.game.findUnique({ where: { id: gameId }, include: { week: true } });
  if (!game) throw badRequest('Game not found', 'game_not_found');
  if (game.status !== 'FINAL') throw badRequest('Game is not final', 'game_not_final');

  const weekId = game.weekId;

  const picks = await tx.pick.findMany({
    where: { gameId },
    include: { matches: true },
  });

  for (const pick of picks) {
    if (pick.status === 'SETTLED' || pick.status === 'VOID') continue;

    const result = determineMatchResult(pick, game);

    for (const match of pick.matches) {
      await tx.match.update({
        where: { id: match.id },
        data: { result, settledAt: new Date() },
      });

      const withOrder = await tx.order.findUnique({ where: { id: match.withOrderId } });
      const againstOrder = await tx.order.findUnique({ where: { id: match.againstOrderId } });
      if (!withOrder || !againstOrder) continue;

      if (result === 'WITH_WON') {
        // Backer returns stake + wins liability; layer loses liability.
        await releaseLocked(tx, withOrder.userId, weekId, match, withOrder.id, match.withStake);
        await creditPayout(tx, withOrder.userId, weekId, match, withOrder.id, match.againstLiability);
        await recordLoss(tx, againstOrder.userId, weekId, match, againstOrder.id, match.againstLiability);
      } else if (result === 'AGAINST_WON') {
        await releaseLocked(tx, againstOrder.userId, weekId, match, againstOrder.id, match.againstLiability);
        await creditPayout(tx, againstOrder.userId, weekId, match, againstOrder.id, match.withStake);
        await recordLoss(tx, withOrder.userId, weekId, match, withOrder.id, match.withStake);
      } else {
        // Push: both stakes return.
        await releaseLocked(tx, withOrder.userId, weekId, match, withOrder.id, match.withStake);
        await releaseLocked(tx, againstOrder.userId, weekId, match, againstOrder.id, match.againstLiability);
      }
    }

    const finalStatus = pick.matches.length === 0 ? 'VOID' : 'SETTLED';
    await tx.pick.update({ where: { id: pick.id }, data: { status: finalStatus } });
  }
}

export async function settleGame(gameId: string) {
  return prisma.$transaction(async (tx) => settleGameInTx(tx, gameId));
}

export async function settleGameAsPartOfWeek(
  tx: Prisma.TransactionClient,
  gameId: string,
): Promise<void> {
  return settleGameInTx(tx, gameId);
}
