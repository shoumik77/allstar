import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { notFound } from '../lib/errors.js';
import { createPick } from '../services/picks.js';
import { cancelOrder, placeOrder } from '../services/matching.js';
import { getOrCreateCurrentWeek, getOrCreateWeek } from '../services/weeks.js';
import { formatAmerican } from '../lib/odds.js';

export const picksRouter = Router();

const orderInclude = {
  select: {
    id: true,
    userId: true,
    side: true,
    risked: true,
    matched: true,
    refunded: true,
    limitOdds: true,
    status: true,
    createdAt: true,
  },
};

const matchInclude = {
  select: {
    id: true,
    withOrderId: true,
    againstOrderId: true,
    withStake: true,
    againstLiability: true,
    odds: true,
    result: true,
    createdAt: true,
  },
};

const pickInclude = {
  creator: { select: { id: true, username: true } },
  game: true,
  orders: orderInclude,
  matches: matchInclude,
} as const;

type PickWithRelations = Awaited<ReturnType<typeof prisma.pick.findFirstOrThrow<{ include: typeof pickInclude }>>>;

function bookSummary(pick: PickWithRelations) {
  const withAvailable = pick.orders
    .filter((o) => o.side === 'WITH' && (o.status === 'OPEN' || o.status === 'PARTIAL'))
    .reduce((sum, o) => sum + (o.risked - o.matched - o.refunded), 0);
  const againstAvailable = pick.orders
    .filter((o) => o.side === 'AGAINST' && (o.status === 'OPEN' || o.status === 'PARTIAL'))
    .reduce((sum, o) => sum + (o.risked - o.matched - o.refunded), 0);
  const totalMatched = pick.matches.reduce((sum, m) => sum + m.withStake, 0);

  return {
    withAvailable,
    againstAvailable,
    totalMatched,
  };
}

function serializePick(pick: PickWithRelations, viewerId?: string) {
  const { withAvailable, againstAvailable, totalMatched } = bookSummary(pick);
  const viewerOrders = viewerId ? pick.orders.filter((o) => o.userId === viewerId) : [];
  const viewerMatches = viewerId
    ? pick.matches.filter((m) => {
        const withOrder = pick.orders.find((o) => o.id === m.withOrderId)!;
        const againstOrder = pick.orders.find((o) => o.id === m.againstOrderId)!;
        return withOrder.userId === viewerId || againstOrder.userId === viewerId;
      })
    : [];

  return {
    ...pick,
    book: {
      withAvailable,
      againstAvailable,
      totalMatched,
      marketOdds: formatAmerican(pick.sideOdds),
    },
    viewerOrders,
    viewerMatches,
    isValid: pick.matches.length > 0,
  };
}

const listSchema = z.object({
  week: z.coerce.number().int().min(1).max(22).optional(),
  season: z.coerce.number().int().min(2020).max(2100).optional(),
  status: z.enum(['OPEN', 'LOCKED', 'VOID', 'SETTLED']).optional(),
  gameId: z.string().optional(),
  mine: z.coerce.boolean().optional(),
});

picksRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const { week, season, status, gameId, mine } = listSchema.parse(req.query);
    const weekRecord =
      week !== undefined
        ? await getOrCreateWeek(season ?? new Date().getUTCFullYear(), week)
        : await getOrCreateCurrentWeek();

    const picks = await prisma.pick.findMany({
      where: {
        game: { weekId: weekRecord.id, ...(gameId ? { id: gameId } : {}) },
        ...(status ? { status } : {}),
        ...(mine ? { orders: { some: { userId: req.userId! } } } : {}),
      },
      include: pickInclude,
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      week: weekRecord,
      picks: picks.map((pick) => serializePick(pick, req.userId)),
    });
  } catch (err) {
    next(err);
  }
});

picksRouter.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const pick = await prisma.pick.findUnique({ where: { id: req.params.id }, include: pickInclude });
    if (!pick) throw notFound('Pick not found', 'pick_not_found');
    res.json(serializePick(pick, req.userId));
  } catch (err) {
    next(err);
  }
});

const createSchema = z.object({
  gameId: z.string().min(1),
  type: z.enum(['MONEYLINE', 'SPREAD']),
  side: z.enum(['HOME', 'AWAY']),
  stake: z.number().int().min(1),
});

picksRouter.post('/', requireAuth, async (req, res, next) => {
  try {
    const input = createSchema.parse(req.body);
    const result = await createPick(req.userId!, input);
    const created = await prisma.pick.findUniqueOrThrow({ where: { id: result.pick.id }, include: pickInclude });
    res.status(201).json(serializePick(created, req.userId));
  } catch (err) {
    next(err);
  }
});

const orderSchema = z.object({
  side: z.enum(['WITH', 'AGAINST']),
  risked: z.number().int().min(1),
  limitOdds: z.number().int().optional(),
});

picksRouter.post('/:id/orders', requireAuth, async (req, res, next) => {
  try {
    const input = orderSchema.parse(req.body);
    const result = await placeOrder(req.userId!, req.params.id, input);
    const updated = await prisma.pick.findUniqueOrThrow({ where: { id: req.params.id }, include: pickInclude });
    res.status(201).json({ ...result, pick: serializePick(updated, req.userId) });
  } catch (err) {
    next(err);
  }
});

picksRouter.post('/orders/:id/cancel', requireAuth, async (req, res, next) => {
  try {
    const { refunded } = await cancelOrder(req.userId!, req.params.id);
    res.json({ refunded });
  } catch (err) {
    next(err);
  }
});
