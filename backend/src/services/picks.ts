import type { Game, PickType, Prisma, TeamSide } from '@prisma/client';
import { prisma } from '../prisma.js';
import { badRequest, notFound } from '../lib/errors.js';
import { placeOrder } from './matching.js';

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

    const { order, fills, matched, resting } = await placeOrder(
      userId,
      pick.id,
      { side: 'WITH', risked: input.stake },
      tx,
    );

    return { pick, order, fills, matched, resting };
  });
}
