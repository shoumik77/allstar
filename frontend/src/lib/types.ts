export type User = {
  id: string;
  email: string;
  username: string;
  emailVerified?: boolean;
  createdAt?: string;
};

export type AuthResponse = {
  user: User;
  accessToken: string;
  refreshToken: string;
};

export type Week = {
  id: string;
  season: number;
  nflWeekNumber: number;
  startsAt: string;
  endsAt: string;
  status: 'OPEN' | 'SETTLING' | 'CLOSED';
};

export type GameStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'FINAL' | 'POSTPONED';

export type Game = {
  id: string;
  externalId: string;
  weekId: string;
  homeTeam: string;
  awayTeam: string;
  kickoff: string;
  status: GameStatus;
  homeScore: number | null;
  awayScore: number | null;
  homeMoneyline: number | null;
  awayMoneyline: number | null;
  spread: number | null;
  homeSpreadOdds: number | null;
  awaySpreadOdds: number | null;
  oddsUpdatedAt: string | null;
};

export type GamesResponse = {
  week: Week;
  games: Game[];
};

export type MeResponse = {
  user: User;
  week: Week;
  balance: { available: number; locked: number; total: number };
  positions: unknown[];
};
