import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { notFound } from '../lib/errors.js';
import { syncWeekGames } from '../services/games.js';
import { settleGame } from '../services/settlement.js';
import { sweepAllKickoffs, sweepGame } from '../services/sweep.js';
import { closeWeek } from '../services/weeklyClose.js';

export const adminRouter = Router();

const syncSchema = z.object({
  season: z.coerce.number().int().min(2020).max(2100).optional(),
  week: z.coerce.number().int().min(1).max(22).optional(),
});

adminRouter.post('/sync', requireAuth, async (req, res, next) => {
  try {
    const { season, week } = syncSchema.parse(req.body ?? {});
    const result = await syncWeekGames(
      week !== undefined ? (season ?? new Date().getUTCFullYear()) : undefined,
      week,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Dev helper: fast-forward a game's state so later phases (settlement) are testable
// without waiting for real kickoffs.
const gameStateSchema = z.object({
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'FINAL', 'POSTPONED']).optional(),
  homeScore: z.number().int().min(0).max(200).nullable().optional(),
  awayScore: z.number().int().min(0).max(200).nullable().optional(),
  kickoff: z.coerce.date().optional(),
});

adminRouter.post('/games/:id/state', requireAuth, async (req, res, next) => {
  try {
    const data = gameStateSchema.parse(req.body ?? {});
    const game = await prisma.game.findUnique({ where: { id: req.params.id } });
    if (!game) throw notFound('Game not found', 'game_not_found');

    const updated = await prisma.game.update({ where: { id: game.id }, data });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/sweep', requireAuth, async (req, res, next) => {
  try {
    const result = await sweepAllKickoffs();
    res.json(result);
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/sweep/:gameId', requireAuth, async (req, res, next) => {
  try {
    const result = await sweepGame(req.params.gameId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

adminRouter.post('/settle/:gameId', requireAuth, async (req, res, next) => {
  try {
    await settleGame(req.params.gameId);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

const closeWeekSchema = z.object({
  weekId: z.string().optional(),
  force: z.coerce.boolean().optional(),
});

adminRouter.post('/close-week', requireAuth, async (req, res, next) => {
  try {
    const { weekId, force } = closeWeekSchema.parse(req.body ?? {});
    const result = await closeWeek(weekId, force);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
