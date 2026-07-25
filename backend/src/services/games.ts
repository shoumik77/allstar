import type { Game } from '@prisma/client';
import { prisma } from '../prisma.js';
import { getOddsProvider } from './odds/index.js';
import { getOrCreateCurrentWeek, getOrCreateWeek } from './weeks.js';

export async function syncWeekGames(season?: number, nflWeekNumber?: number): Promise<{ weekId: string; synced: number }> {
  const week =
    season !== undefined && nflWeekNumber !== undefined
      ? await getOrCreateWeek(season, nflWeekNumber)
      : await getOrCreateCurrentWeek();

  const providerGames = await getOddsProvider().getWeekGames(week.season, week.nflWeekNumber, week.startsAt);
  const oddsUpdatedAt = new Date();

  for (const game of providerGames) {
    const odds = {
      homeMoneyline: game.homeMoneyline,
      awayMoneyline: game.awayMoneyline,
      spread: game.spread,
      homeSpreadOdds: game.homeSpreadOdds,
      awaySpreadOdds: game.awaySpreadOdds,
      oddsUpdatedAt,
    };

    await prisma.game.upsert({
      where: { externalId: game.externalId },
      update: { kickoff: game.kickoff, ...odds },
      create: {
        externalId: game.externalId,
        weekId: week.id,
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        kickoff: game.kickoff,
        ...odds,
      },
    });
  }

  return { weekId: week.id, synced: providerGames.length };
}

export async function listWeekGames(season?: number, nflWeekNumber?: number): Promise<{ week: Awaited<ReturnType<typeof getOrCreateCurrentWeek>>; games: Game[] }> {
  const week =
    season !== undefined && nflWeekNumber !== undefined
      ? await getOrCreateWeek(season, nflWeekNumber)
      : await getOrCreateCurrentWeek();

  const games = await prisma.game.findMany({
    where: { weekId: week.id },
    orderBy: [{ kickoff: 'asc' }, { homeTeam: 'asc' }],
  });

  return { week, games };
}
