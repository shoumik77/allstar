export type ProviderGame = {
  externalId: string;
  season: number;
  nflWeekNumber: number;
  homeTeam: string;
  awayTeam: string;
  kickoff: Date;
  // Home team's spread, e.g. -3.5 means home favored by 3.5
  spread: number;
  homeMoneyline: number;
  awayMoneyline: number;
  homeSpreadOdds: number;
  awaySpreadOdds: number;
};

export interface OddsProvider {
  readonly name: string;
  getWeekGames(season: number, nflWeekNumber: number, weekStartsAt: Date): Promise<ProviderGame[]>;
}
