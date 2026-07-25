import type { Game, PickType, PositionSide, Prisma, TeamSide } from '@prisma/client';
import { prisma } from '../prisma.js';
import { badRequest, conflict, notFound } from '../lib/errors.js';
import { MIN_STAKE, maxStakeFor } from '../lib/pools.js';
import { ensureWeeklyBalance } from './weeks.js';

type OddsSnapshot = {
  line: number | null;
  sideOdds: number;
  fadeOdds: number;
  snapHomeMoneyline: number | null;
  snapAwayMoneyline: number | null;
  snapSpread: number | null;
  snapHomeSpreadOdds: number | null;
  snapAwaySpreadOdds: number | null;
};

export function snapshotOdds(game: Game, type: PickType, side: TeamSide): OddsSnapshot {
  const base = {
    snapHomeMoneyline: game.homeMoneyline,
    snapAwayMoneyline: game.awayMoneyline,
    snapSpread: game.spread,
    snapHomeSpreadOdds: game.homeSpreadOdds,
    snapAwaySpreadOdds: game.awaySpreadOdds,
  };

  if (type === 'MONEYLINE') {
    if (game.homeMoneyline === null || game.awayMoneyline === null) {
      throw badRequest('Moneyline odds are unavailable for this game', 'odds_unavailable');
    }
    return {
      ...base,
      line: null,
      sideOdds: side === 'HOME' ? game.homeMoneyline : game.awayMoneyline,
      fadeOdds: side === 'HOME' ? game.awayMoneyline : game.homeMoneyline,
    };
  }

  if (game.spread === null || game.homeSpreadOdds === null || game.awaySpreadOdds === null) {
    throw badRequest('Spread odds are unavailable for this game', 'odds_unavailable');
  }
  return {
    ...base,
    line: side === 'HOME' ? game.spread : -game.spread,
    sideOdds: side === 'HOME' ? game.homeSpreadOdds : game.awaySpreadOdds,
    fadeOdds: side === 'HOME' ? game.awaySpreadOdds : game.homeSpreadOdds,
  };
}

export function assertStakeAllowed(stake: number, availableBalance: number): void {
  if (!Number.isInteger(stake)) throw badRequest('Stake must be a whole number of points', 'invalid_stake');
  if (stake < MIN_STAKE) throw badRequest(`Minimum stake is ${MIN_STAKE} points`, 'stake_below_min');
  if (stake > availableBalance) throw badRequest('Insufficient balance', 'insufficient_balance');

  const cap = maxStakeFor(availableBalance);
  if (stake > cap) {
    throw badRequest(`Max stake is 25% of your balance (${cap} points)`, 'stake_above_max');
  }
}

async function debitStake(
  tx: Prisma.TransactionClient,
  params: { userId: string; weekId: string; stake: number; pickId: string; positionId: string },
) {
  await tx.weeklyBalance.update({
    where: { userId_weekId: { userId: params.userId, weekId: params.weekId } },
    data: { balance: { decrement: params.stake }, locked: { increment: params.stake } },
  });

  await tx.transaction.create({
    data: {
      userId: params.userId,
      weekId: params.weekId,
      type: 'STAKE',
      amount: -params.stake,
      pickId: params.pickId,
      positionId: params.positionId,
    },
  });
}

export async function createPick(
  userId: string,
  input: { gameId: string; type: PickType; side: TeamSide; stake: number },
) {
  return prisma.$transaction(async (tx) => {
    const game = await tx.game.findUnique({ where: { id: input.gameId } });
    if (!game) throw notFound('Game not found', 'game_not_found');
    if (game.kickoff <= new Date() || game.status !== 'SCHEDULED') {
      throw badRequest('This game has already started', 'game_started');
    }

    const balance = await ensureWeeklyBalance(userId, game.weekId, tx);
    assertStakeAllowed(input.stake, balance.balance);

    const snapshot = snapshotOdds(game, input.type, input.side);

    const pick = await tx.pick.create({
      data: {
        creatorId: userId,
        gameId: game.id,
        type: input.type,
        side: input.side,
        ...snapshot,
      },
    });

    const position = await tx.position.create({
      data: { pickId: pick.id, userId, side: 'WITH', stake: input.stake },
    });

    await debitStake(tx, {
      userId,
      weekId: game.weekId,
      stake: input.stake,
      pickId: pick.id,
      positionId: position.id,
    });

    return { pick, position };
  });
}

export async function joinPick(
  userId: string,
  pickId: string,
  input: { side: PositionSide; stake: number },
) {
  return prisma.$transaction(async (tx) => {
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

    const existing = await tx.position.findUnique({ where: { pickId_userId: { pickId, userId } } });
    if (existing) throw conflict('You already have a position on this pick', 'position_exists');

    const balance = await ensureWeeklyBalance(userId, pick.game.weekId, tx);
    assertStakeAllowed(input.stake, balance.balance);

    const position = await tx.position.create({
      data: { pickId: pick.id, userId, side: input.side, stake: input.stake },
    });

    await debitStake(tx, {
      userId,
      weekId: pick.game.weekId,
      stake: input.stake,
      pickId: pick.id,
      positionId: position.id,
    });

    return { pick, position };
  });
}
