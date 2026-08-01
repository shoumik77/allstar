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

    const orders = await prisma.order.findMany({
      where: { userId: user.id, pick: { game: { weekId: week.id } } },
      orderBy: { createdAt: 'desc' },
      include: {
        pick: { include: { game: true } },
        withMatches: { select: { id: true, withStake: true, againstLiability: true, odds: true, result: true } },
        againstMatches: { select: { id: true, withStake: true, againstLiability: true, odds: true, result: true } },
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
      orders,
    });
  } catch (err) {
    next(err);
  }
});

meRouter.get('/transactions', requireAuth, async (req, res, next) => {
  try {
    const week = await getOrCreateCurrentWeek();
    const page = Math.max(1, Number(req.query.page ?? '1'));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? '50')));
    const skip = (page - 1) * limit;

    const [items, count] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId: req.userId! },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { pick: { include: { game: true } } },
      }),
      prisma.transaction.count({ where: { userId: req.userId! } }),
    ]);

    res.json({
      week,
      items,
      pagination: { page, limit, total: count, pages: Math.ceil(count / limit) },
    });
  } catch (err) {
    next(err);
  }
});
