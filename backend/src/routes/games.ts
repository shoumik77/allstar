import { Router } from 'express';
import { z } from 'zod';
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
