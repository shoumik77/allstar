import { Router } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { notFound } from '../lib/errors.js';
import { ensureWeeklyBalance, getOrCreateCurrentWeek } from '../services/weeks.js';

export const meRouter = Router();

meRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user) throw notFound('User not found', 'user_not_found');

    const week = await getOrCreateCurrentWeek();
    const balance = await ensureWeeklyBalance(user.id, week.id);

    const positions = await prisma.position.findMany({
      where: { userId: user.id, pick: { game: { weekId: week.id } } },
      orderBy: { createdAt: 'desc' },
      include: {
        pick: {
          include: { game: true },
        },
      },
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      },
      week: {
        id: week.id,
        season: week.season,
        nflWeekNumber: week.nflWeekNumber,
        startsAt: week.startsAt,
        endsAt: week.endsAt,
        status: week.status,
      },
      balance: {
        available: balance.balance,
        locked: balance.locked,
        total: balance.balance + balance.locked,
      },
      positions,
    });
  } catch (err) {
    next(err);
  }
});
