import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { notFound } from '../lib/errors.js';
import { poolTotals } from '../lib/pools.js';
import { createPick, joinPick } from '../services/picks.js';
import { getOrCreateCurrentWeek, getOrCreateWeek } from '../services/weeks.js';

export const picksRouter = Router();

const pickInclude = {
  creator: { select: { id: true, username: true } },
  game: true,
  positions: {
    select: { id: true, userId: true, side: true, stake: true, payout: true, createdAt: true },
  },
} as const;

type PickWithRelations = Awaited<ReturnType<typeof prisma.pick.findFirstOrThrow<{ include: typeof pickInclude }>>>;

function serializePick(pick: PickWithRelations, viewerId?: string) {
  const { withPool, againstPool } = poolTotals(pick.positions);
  const viewerPosition = viewerId ? pick.positions.find((p) => p.userId === viewerId) ?? null : null;

  return {
    ...pick,
    pools: {
      with: withPool,
      against: againstPool,
      participants: pick.positions.length,
    },
    viewerPosition,
    isValid: withPool > 0 && againstPool > 0,
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
        ...(mine ? { positions: { some: { userId: req.userId! } } } : {}),
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
    const { pick } = await createPick(req.userId!, input);
    const created = await prisma.pick.findUniqueOrThrow({ where: { id: pick.id }, include: pickInclude });
    res.status(201).json(serializePick(created, req.userId));
  } catch (err) {
    next(err);
  }
});

const joinSchema = z.object({
  side: z.enum(['WITH', 'AGAINST']),
  stake: z.number().int().min(1),
});

picksRouter.post('/:id/positions', requireAuth, async (req, res, next) => {
  try {
    const input = joinSchema.parse(req.body);
    await joinPick(req.userId!, req.params.id, input);
    const updated = await prisma.pick.findUniqueOrThrow({ where: { id: req.params.id }, include: pickInclude });
    res.status(201).json(serializePick(updated, req.userId));
  } catch (err) {
    next(err);
  }
});
