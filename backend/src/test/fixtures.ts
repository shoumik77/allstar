import { randomUUID } from 'node:crypto';
import type { Game, Pick, User, Week, WeeklyBalance } from '@prisma/client';
import { prisma } from '../prisma.js';

let sequence = 0;

export async function createUser(): Promise<User> {
  sequence += 1;
  const id = `test-${Date.now()}-${sequence}`;
  return prisma.user.create({
    data: { email: `${id}@test.dev`, username: id, passwordHash: 'test-hash' },
  });
}

export async function createWeek(): Promise<Week> {
  return prisma.week.create({
    data: {
      season: 3000 + Math.floor(Math.random() * 1_000_000),
      nflWeekNumber: 1 + Math.floor(Math.random() * 17),
      startsAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      endsAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
    },
  });
}

export async function createGamePick(
  weekId: string,
  opts: { kickoffInHours?: number; sideOdds?: number; fadeOdds?: number; creatorId?: string } = {},
): Promise<{ game: Game; pick: Pick }> {
  const sideOdds = opts.sideOdds ?? -150;
  const fadeOdds = opts.fadeOdds ?? 130;
  const creatorId = opts.creatorId ?? (await createUser()).id;

  const game = await prisma.game.create({
    data: {
      externalId: `game-${randomUUID()}`,
      weekId,
      homeTeam: 'Home Team',
      awayTeam: 'Away Team',
      kickoff: new Date(Date.now() + (opts.kickoffInHours ?? 24) * 60 * 60 * 1000),
      status: 'SCHEDULED',
      homeMoneyline: sideOdds,
      awayMoneyline: fadeOdds,
    },
  });

  const pick = await prisma.pick.create({
    data: {
      creatorId,
      gameId: game.id,
      type: 'MONEYLINE',
      side: 'HOME',
      sideOdds,
      fadeOdds,
    },
  });

  return { game, pick };
}

export async function setBalance(userId: string, weekId: string, balance: number): Promise<WeeklyBalance> {
  return prisma.weeklyBalance.upsert({
    where: { userId_weekId: { userId, weekId } },
    update: { balance, locked: 0 },
    create: { userId, weekId, balance, locked: 0 },
  });
}

export async function truncateAll(): Promise<void> {
  await prisma.$transaction([
    prisma.match.deleteMany(),
    prisma.transaction.deleteMany(),
    prisma.order.deleteMany(),
    prisma.pick.deleteMany(),
    prisma.game.deleteMany(),
    prisma.weeklyBalance.deleteMany(),
    prisma.week.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}
