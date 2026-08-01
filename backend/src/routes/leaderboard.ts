import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { getOrCreateCurrentWeek } from '../services/weeks.js';

export const leaderboardRouter = Router();

const listSchema = z.object({
  week: z.coerce.number().int().min(1).max(22).optional(),
  season: z.coerce.number().int().min(2020).max(2100).optional(),
});

leaderboardRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const { week, season } = listSchema.parse(req.query);
    let targetWeek;
    if (week !== undefined) {
      targetWeek = await prisma.week.findUnique({
        where: { season_nflWeekNumber: { season: season ?? new Date().getUTCFullYear(), nflWeekNumber: week } },
      });
      if (!targetWeek) return res.json({ week: null, rankings: [] });
    } else {
      targetWeek = await getOrCreateCurrentWeek();
    }

    const balances = await prisma.weeklyBalance.findMany({
      where: { weekId: targetWeek.id },
      include: { user: { select: { id: true, username: true } } },
      orderBy: [{ balance: 'desc' }, { locked: 'desc' }],
    });

    const totalPoints = balances.reduce((sum, b) => sum + b.balance + b.locked, 0) || 1;
    const rankings = balances.map((b, index) => ({
      rank: index + 1,
      userId: b.userId,
      username: b.user.username,
      available: b.balance,
      locked: b.locked,
      total: b.balance + b.locked,
      share: totalPoints > 0 ? (b.balance + b.locked) / totalPoints : 0,
    }));

    res.json({
      week: {
        id: targetWeek.id,
        season: targetWeek.season,
        nflWeekNumber: targetWeek.nflWeekNumber,
        startsAt: targetWeek.startsAt,
        endsAt: targetWeek.endsAt,
        status: targetWeek.status,
      },
      rankings,
    });
  } catch (err) {
    next(err);
  }
});
