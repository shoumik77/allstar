import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { notFound } from '../lib/errors.js';
import { ensureWeeklyBalance, getOrCreateCurrentWeek } from '../services/weeks.js';

export const meRouter = Router();

const ordersQuerySchema = z.object({
  scope: z.enum(['week', 'all']).default('week'),
});

const transactionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  type: z
    .enum(['STAKE', 'REFUND', 'PAYOUT', 'ORDER_CANCEL', 'UNMATCHED_REFUND', 'WEEKLY_RESET', 'SETTLEMENT_LOSS'])
    .optional(),
});

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

meRouter.get('/orders', requireAuth, async (req, res, next) => {
  try {
    const { scope } = ordersQuerySchema.parse(req.query);
    const week = await getOrCreateCurrentWeek();

    const orders = await prisma.order.findMany({
      where: {
        userId: req.userId!,
        ...(scope === 'week' ? { pick: { game: { weekId: week.id } } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        pick: { include: { game: { include: { week: true } } } },
        withMatches: { select: { id: true, withStake: true, againstLiability: true, odds: true, result: true } },
        againstMatches: { select: { id: true, withStake: true, againstLiability: true, odds: true, result: true } },
      },
    });

    res.json({ week, orders });
  } catch (err) {
    next(err);
  }
});

meRouter.get('/transactions', requireAuth, async (req, res, next) => {
  try {
    const { page, limit, type } = transactionsQuerySchema.parse(req.query);
    const week = await getOrCreateCurrentWeek();
    const skip = (page - 1) * limit;
    const where = { userId: req.userId!, ...(type ? { type } : {}) };

    const [items, count] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          pick: { include: { game: true } },
          order: { select: { side: true } },
        },
      }),
      prisma.transaction.count({ where }),
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
