import { moneylineForSpread } from '../../lib/odds.js';
import type { OddsProvider, ProviderGame } from './types.js';

const TEAMS = [
  'Arizona Cardinals', 'Atlanta Falcons', 'Baltimore Ravens', 'Buffalo Bills',
  'Carolina Panthers', 'Chicago Bears', 'Cincinnati Bengals', 'Cleveland Browns',
  'Dallas Cowboys', 'Denver Broncos', 'Detroit Lions', 'Green Bay Packers',
  'Houston Texans', 'Indianapolis Colts', 'Jacksonville Jaguars', 'Kansas City Chiefs',
  'Las Vegas Raiders', 'Los Angeles Chargers', 'Los Angeles Rams', 'Miami Dolphins',
  'Minnesota Vikings', 'New England Patriots', 'New Orleans Saints', 'New York Giants',
  'New York Jets', 'Philadelphia Eagles', 'Pittsburgh Steelers', 'San Francisco 49ers',
  'Seattle Seahawks', 'Tampa Bay Buccaneers', 'Tennessee Titans', 'Washington Commanders',
];

const SPREADS = [1.5, 2.5, 3, 3.5, 4.5, 6.5, 7, 9.5, 10.5, 13.5];

// Minutes after the Tuesday 10:00 UTC week boundary for each slot.
const TNF = 3740; // Thu 8:20pm ET
const SUN_EARLY = 7620; // Sun 1:00pm ET
const SUN_LATE = 7825; // Sun 4:25pm ET
const SNF = 8060; // Sun 8:20pm ET
const MNF = 9500; // Mon 8:20pm ET

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z]+/g, '-');
}

function slotFor(index: number): number {
  if (index === 0) return TNF;
  if (index <= 9) return SUN_EARLY;
  if (index <= 13) return SUN_LATE;
  if (index === 14) return SNF;
  return MNF;
}

export class MockOddsProvider implements OddsProvider {
  readonly name = 'mock';

  async getWeekGames(season: number, nflWeekNumber: number, weekStartsAt: Date): Promise<ProviderGame[]> {
    const rand = mulberry32(season * 100 + nflWeekNumber);
    const teams = [...TEAMS];

    // Deterministic Fisher-Yates shuffle.
    for (let i = teams.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rand() * (i + 1));
      [teams[i], teams[j]] = [teams[j], teams[i]];
    }

    const games: ProviderGame[] = [];
    for (let i = 0; i < teams.length / 2; i += 1) {
      const awayTeam = teams[i * 2];
      const homeTeam = teams[i * 2 + 1];

      const magnitude = SPREADS[Math.floor(rand() * SPREADS.length)];
      const homeIsFavorite = rand() < 0.6; // home-field edge
      const spread = homeIsFavorite ? -magnitude : magnitude;

      const { favorite, underdog } = moneylineForSpread(spread);
      const kickoff = new Date(weekStartsAt.getTime() + slotFor(i) * 60_000);

      games.push({
        externalId: `mock-${season}-w${nflWeekNumber}-${slugify(awayTeam)}-at-${slugify(homeTeam)}`,
        season,
        nflWeekNumber,
        homeTeam,
        awayTeam,
        kickoff,
        spread,
        homeMoneyline: homeIsFavorite ? favorite : underdog,
        awayMoneyline: homeIsFavorite ? underdog : favorite,
        homeSpreadOdds: -110,
        awaySpreadOdds: -110,
      });
    }

    return games;
  }
}
