import { prisma } from '../prisma.js';
import { syncWeekGames } from '../services/games.js';
import { getOrCreateCurrentWeek } from '../services/weeks.js';

async function main() {
  const week = await getOrCreateCurrentWeek();
  const { synced } = await syncWeekGames(week.season, week.nflWeekNumber);
  console.log(`Seeded ${synced} games for ${week.season} week ${week.nflWeekNumber}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
