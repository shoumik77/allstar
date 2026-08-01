import type { Prisma } from '@prisma/client';
import { prisma } from '../prisma.js';
import { badRequest } from '../lib/errors.js';
import { getOrCreateCurrentWeek, weekWindowFor } from './weeks.js';
import { settleGameAsPartOfWeek } from './settlement.js';
import { sweepGameAsPartOfWeek } from './sweep.js';
import { releaseOrderRemainder } from './matching.js';

const STARTING_BALANCE = 1000;

async function voidGameAsPartOfWeek(tx: Prisma.TransactionClient, gameId: string): Promise<void> {
  const game = await tx.game.findUnique({ where: { id: gameId } });
  if (!game) throw badRequest('Game not found', 'game_not_found');

  await tx.game.update({ where: { id: gameId }, data: { status: 'POSTPONED' } });

  const picks = await tx.pick.findMany({
    where: { gameId },
    include: { orders: true, matches: true },
  });

  for (const pick of picks) {
    for (const order of pick.orders) {
      if (order.status === 'OPEN' || order.status === 'PARTIAL') {
        await releaseOrderRemainder(tx, order.id, 'UNMATCHED_REFUND');
      }
    }

    // Refund matched stakes on both sides for each match.
    for (const match of pick.matches) {
      const withOrder = await tx.order.findUnique({ where: { id: match.withOrderId } });
      const againstOrder = await tx.order.findUnique({ where: { id: match.againstOrderId } });
      if (!withOrder || !againstOrder) continue;

      await tx.weeklyBalance.update({
        where: { userId_weekId: { userId: withOrder.userId, weekId: game.weekId } },
        data: { balance: { increment: match.withStake }, locked: { decrement: match.withStake } },
      });
      await tx.transaction.create({
        data: {
          userId: withOrder.userId,
          weekId: game.weekId,
          type: 'REFUND',
          amount: match.withStake,
          pickId: pick.id,
          matchId: match.id,
        },
      });

      await tx.weeklyBalance.update({
        where: { userId_weekId: { userId: againstOrder.userId, weekId: game.weekId } },
        data: { balance: { increment: match.againstLiability }, locked: { decrement: match.againstLiability } },
      });
      await tx.transaction.create({
        data: {
          userId: againstOrder.userId,
          weekId: game.weekId,
          type: 'REFUND',
          amount: match.againstLiability,
          pickId: pick.id,
          matchId: match.id,
        },
      });
    }

    await tx.pick.update({ where: { id: pick.id }, data: { status: 'VOID' } });
  }
}

export async function closeWeek(weekId?: string, force = false): Promise<{ closedWeekId: string; nextWeekId: string; settled: number; swept: number; voided: number }> {
  return prisma.$transaction(async (tx) => {
    const targetWeekId = weekId ?? (await getOrCreateCurrentWeek(tx)).id;
    const week = await tx.week.findUnique({ where: { id: targetWeekId }, include: { games: true } });
    if (!week) throw badRequest('Week not found', 'week_not_found');

    if (!force) {
      if (week.status !== 'OPEN') throw badRequest('Week is not open', 'week_not_open');
      const now = new Date();
      if (now < week.endsAt) throw badRequest('Week has not ended yet', 'week_not_ended');
      const unfinished = week.games.some((g) => g.status !== 'FINAL' && g.status !== 'POSTPONED');
      if (unfinished) throw badRequest('Not all games are final or postponed', 'week_unfinished');
    }

    await tx.week.update({ where: { id: week.id }, data: { status: 'SETTLING' } });

    let settled = 0;
    let swept = 0;
    let voided = 0;

    for (const game of week.games) {
      if (game.status === 'FINAL') {
        await settleGameAsPartOfWeek(tx, game.id);
        settled += 1;
      } else if (game.status === 'POSTPONED') {
        await voidGameAsPartOfWeek(tx, game.id);
        voided += 1;
      } else if (game.status === 'SCHEDULED' || game.status === 'IN_PROGRESS') {
        // Force-closing an unfinished game: sweep it, then if still not final, void it.
        if (force) {
          const { lockedPicks } = await sweepGameAsPartOfWeek(tx, game.id);
          if (lockedPicks > 0) {
            // Game was treated as in-progress and locked; we still need to void because no score.
            // Reset game status so voidGameAsPartOfWeek can refund matches.
            await tx.game.update({ where: { id: game.id }, data: { status: 'POSTPONED' } });
            await voidGameAsPartOfWeek(tx, game.id);
            voided += 1;
          } else {
            voided += 1;
          }
          swept += 1;
        }
      }
    }

    // Create next week's balance for every user who had a balance this week.
    const balances = await tx.weeklyBalance.findMany({ where: { weekId: week.id }, select: { userId: true } });
    const nextWindow = weekWindowFor(new Date(week.endsAt));
    const nextNumber = week.nflWeekNumber + 1;
    const nextWeek = await tx.week.upsert({
      where: { season_nflWeekNumber: { season: week.season, nflWeekNumber: nextNumber } },
      update: {},
      create: { season: week.season, nflWeekNumber: nextNumber, startsAt: nextWindow.startsAt, endsAt: nextWindow.endsAt },
    });

    for (const { userId } of balances) {
      await tx.weeklyBalance.upsert({
        where: { userId_weekId: { userId, weekId: nextWeek.id } },
        update: {},
        create: { userId, weekId: nextWeek.id, balance: STARTING_BALANCE, locked: 0 },
      });

      await tx.transaction.create({
        data: {
          userId,
          weekId: nextWeek.id,
          type: 'WEEKLY_RESET',
          amount: STARTING_BALANCE,
          note: `Week ${week.nflWeekNumber} final balance will be recorded; starting week ${nextNumber} with ${STARTING_BALANCE}`,
        },
      });
    }

    await tx.week.update({ where: { id: week.id }, data: { status: 'CLOSED' } });

    return { closedWeekId: week.id, nextWeekId: nextWeek.id, settled, swept, voided };
  });
}
