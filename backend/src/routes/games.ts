import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { notFound } from '../lib/errors.js';
import { listWeekGames } from '../services/games.js';

export const gamesRouter = Router();

const querySchema = z.object({
  week: z.coerce.number().int().min(1).max(22).optional(),
  season: z.coerce.number().int().min(2020).max(2100).optional(),
});

gamesRouter.get('/', async (req, res, next) => {
  try {
    const { week, season } = querySchema.parse(req.query);
    const useExplicitWeek = week !== undefined;
    const { week: weekRecord, games } = await listWeekGames(
      useExplicitWeek ? (season ?? new Date().getUTCFullYear()) : undefined,
      useExplicitWeek ? week : undefined,
    );

    res.json({
      week: {
        id: weekRecord.id,
        season: weekRecord.season,
        nflWeekNumber: weekRecord.nflWeekNumber,
        startsAt: weekRecord.startsAt,
        endsAt: weekRecord.endsAt,
        status: weekRecord.status,
      },
      games,
    });
  } catch (err) {
    next(err);
  }
});

gamesRouter.get('/:id', async (req, res, next) => {
  try {
    const game = await prisma.game.findUnique({ where: { id: req.params.id }, include: { week: true } });
    if (!game) throw notFound('Game not found', 'game_not_found');
    res.json(game);
  } catch (err) {
    next(err);
  }
});
