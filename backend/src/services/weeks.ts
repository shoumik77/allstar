import type { Prisma, Week, WeeklyBalance } from '@prisma/client';
import { prisma } from '../prisma.js';

const STARTING_BALANCE = 1000;

// Weeks run Tuesday 6am ET -> next Tuesday 6am ET. We approximate ET as UTC-4
// (DST, which covers the NFL season) so the boundary is Tuesday 10:00 UTC.
const WEEK_BOUNDARY_UTC_HOUR = 10;

export function weekWindowFor(date: Date): { startsAt: Date; endsAt: Date } {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), WEEK_BOUNDARY_UTC_HOUR, 0, 0, 0));
  // Rewind to the most recent Tuesday boundary at or before `date`.
  const daysSinceTuesday = (start.getUTCDay() - 2 + 7) % 7;
  start.setUTCDate(start.getUTCDate() - daysSinceTuesday);
  if (start > date) {
    start.setUTCDate(start.getUTCDate() - 7);
  }
  const endsAt = new Date(start);
  endsAt.setUTCDate(endsAt.getUTCDate() + 7);
  return { startsAt: start, endsAt };
}

// NFL week 1 kicks off the first full week of September; we number weeks from
// the Tuesday boundary preceding Sept 1 of the season year.
export function seasonWeekNumberFor(date: Date): { season: number; nflWeekNumber: number } {
  const season = date.getUTCMonth() >= 2 ? date.getUTCFullYear() : date.getUTCFullYear() - 1;
  const seasonStart = weekWindowFor(new Date(Date.UTC(season, 8, 1))).startsAt;
  const { startsAt } = weekWindowFor(date);
  const diffWeeks = Math.round((startsAt.getTime() - seasonStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
  return { season, nflWeekNumber: Math.max(1, diffWeeks + 1) };
}

export async function getOrCreateCurrentWeek(client: Prisma.TransactionClient | typeof prisma = prisma): Promise<Week> {
  const now = new Date();
  const { startsAt, endsAt } = weekWindowFor(now);
  const { season, nflWeekNumber } = seasonWeekNumberFor(now);

  return client.week.upsert({
    where: { season_nflWeekNumber: { season, nflWeekNumber } },
    update: {},
    create: { season, nflWeekNumber, startsAt, endsAt },
  });
}

export async function getOrCreateWeek(
  season: number,
  nflWeekNumber: number,
  client: Prisma.TransactionClient | typeof prisma = prisma,
): Promise<Week> {
  const existing = await client.week.findUnique({ where: { season_nflWeekNumber: { season, nflWeekNumber } } });
  if (existing) return existing;

  const current = weekWindowFor(new Date());
  const currentNumber = seasonWeekNumberFor(new Date()).nflWeekNumber;
  const offsetWeeks = nflWeekNumber - currentNumber;
  const startsAt = new Date(current.startsAt);
  startsAt.setUTCDate(startsAt.getUTCDate() + offsetWeeks * 7);
  const endsAt = new Date(startsAt);
  endsAt.setUTCDate(endsAt.getUTCDate() + 7);

  return client.week.create({ data: { season, nflWeekNumber, startsAt, endsAt } });
}

export async function ensureWeeklyBalance(
  userId: string,
  weekId: string,
  client: Prisma.TransactionClient | typeof prisma = prisma,
): Promise<WeeklyBalance> {
  return client.weeklyBalance.upsert({
    where: { userId_weekId: { userId, weekId } },
    update: {},
    create: { userId, weekId, balance: STARTING_BALANCE, locked: 0 },
  });
}

export { STARTING_BALANCE };
