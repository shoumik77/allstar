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

export type OrderStatus = 'OPEN' | 'PARTIAL' | 'FILLED' | 'CANCELLED';

export type OrderSide = 'WITH' | 'AGAINST';

export type Order = {
  id: string;
  pickId: string;
  userId: string;
  side: OrderSide;
  risked: number;
  matched: number;
  refunded: number;
  limitOdds: number;
  status: OrderStatus;
  createdAt: string;
};

export type MatchResult = 'PENDING' | 'WITH_WON' | 'AGAINST_WON' | 'PUSH';

export type Match = {
  id: string;
  pickId: string;
  withOrderId: string;
  againstOrderId: string;
  withStake: number;
  againstLiability: number;
  odds: number;
  result: MatchResult;
  settledAt: string | null;
  createdAt: string;
};

export type GamePick = {
  id: string;
  creatorId: string;
  gameId: string;
  type: 'MONEYLINE' | 'SPREAD';
  side: 'HOME' | 'AWAY';
  status: 'OPEN' | 'LOCKED' | 'VOID' | 'SETTLED';
  createdAt: string;
  line: number | null;
  snapHomeMoneyline: number | null;
  snapAwayMoneyline: number | null;
  snapSpread: number | null;
  snapHomeSpreadOdds: number | null;
  snapAwaySpreadOdds: number | null;
  sideOdds: number;
  fadeOdds: number;
  creator: { id: string; username: string };
  game: Game;
  orders: Order[];
  matches: Match[];
  book: {
    withAvailable: number;
    againstAvailable: number;
    totalMatched: number;
    marketOdds: string;
  };
  viewerOrders: Order[];
  viewerMatches: Match[];
  isValid: boolean;
};

export type GamePicksResponse = {
  week: Week;
  picks: GamePick[];
};

export type PlaceOrderResponse = {
  order: Order;
  fills: Array<{ restingOrderId: string; odds: number; withStake: number; againstLiability: number }>;
  matched: number;
  resting: number;
  pick: GamePick;
};

type MatchLite = {
  id: string;
  withStake: number;
  againstLiability: number;
  odds: number;
  result: MatchResult;
};

export type MeResponse = {
  user: User;
  week: Week;
  balance: { available: number; locked: number; total: number };
  orders: (Order & {
    pick: GamePick & { game: Game };
    withMatches: MatchLite[];
    againstMatches: MatchLite[];
  })[];
};
