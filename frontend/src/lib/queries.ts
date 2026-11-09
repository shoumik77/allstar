import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './api';
import type {
  Game,
  GamePick,
  GamePicksResponse,
  GamesResponse,
  LeaderboardResponse,
  MeResponse,
  MyOrdersResponse,
  PlaceOrderResponse,
  TransactionType,
  TransactionsResponse,
} from './types';

export const queryKeys = {
  me: ['me'] as const,
  games: (week?: number, season?: number) => ['games', { week, season }] as const,
  game: (id: string) => ['games', id] as const,
  picks: (params?: Record<string, unknown>) => ['picks', params] as const,
  pick: (id: string) => ['pick', id] as const,
  myOrders: (scope: string) => ['my-orders', scope] as const,
  transactions: (params: Record<string, unknown>) => ['transactions', params] as const,
  leaderboard: (week?: number, season?: number) => ['leaderboard', { week, season }] as const,
};

export function useGames(week?: number, season?: number) {
  return useQuery({
    queryKey: queryKeys.games(week, season),
    queryFn: () => {
      const params = new URLSearchParams();
      if (week !== undefined) params.set('week', String(week));
      if (season !== undefined) params.set('season', String(season));
      const qs = params.toString();
      return api<GamesResponse>(`/games${qs ? `?${qs}` : ''}`);
    },
  });
}

export function useGame(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.game(id ?? ''),
    queryFn: () => api<Game>(`/games/${id}`),
    enabled: Boolean(id),
  });
}

export function usePicks(
  params: { week?: number; season?: number; status?: string; gameId?: string; mine?: boolean } = {},
  opts: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: queryKeys.picks(params),
    enabled: opts.enabled,
    queryFn: () => {
      const search = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) search.set(key, String(value));
      }
      const qs = search.toString();
      return api<GamePicksResponse>(`/picks${qs ? `?${qs}` : ''}`);
    },
  });
}

export function usePick(id: string | undefined, opts: { refetchInterval?: number } = {}) {
  return useQuery({
    queryKey: queryKeys.pick(id ?? ''),
    queryFn: () => api<GamePick>(`/picks/${id}`),
    enabled: Boolean(id),
    refetchInterval: opts.refetchInterval,
  });
}

export function useMe() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: () => api<MeResponse>('/me'),
  });
}

export function useMyOrders(scope: 'week' | 'all' = 'week') {
  return useQuery({
    queryKey: queryKeys.myOrders(scope),
    queryFn: () => api<MyOrdersResponse>(`/me/orders?scope=${scope}`),
  });
}

export function useTransactions(params: { page?: number; limit?: number; type?: TransactionType } = {}) {
  const { page = 1, limit = 50, type } = params;
  return useQuery({
    queryKey: queryKeys.transactions({ page, limit, type }),
    queryFn: () => {
      const search = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (type) search.set('type', type);
      return api<TransactionsResponse>(`/me/transactions?${search.toString()}`);
    },
  });
}

export function useLeaderboard(week?: number, season?: number) {
  return useQuery({
    queryKey: queryKeys.leaderboard(week, season),
    queryFn: () => {
      const params = new URLSearchParams();
      if (week !== undefined) params.set('week', String(week));
      if (season !== undefined) params.set('season', String(season));
      const qs = params.toString();
      return api<LeaderboardResponse>(`/leaderboard${qs ? `?${qs}` : ''}`);
    },
  });
}

const INVALIDATE = [queryKeys.me[0], 'picks', 'pick', 'my-orders', 'transactions', 'leaderboard'];

function useInvalidatingMutation<TVars, TResult>(fn: (vars: TVars) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSettled: () => {
      for (const key of INVALIDATE) {
        void queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
  });
}

export function usePlaceOrder() {
  return useInvalidatingMutation(
    (vars: { pickId: string; side: 'WITH' | 'AGAINST'; risked: number; limitOdds?: number }) =>
      api<PlaceOrderResponse>(`/picks/${vars.pickId}/orders`, {
        method: 'POST',
        body: JSON.stringify({ side: vars.side, risked: vars.risked, limitOdds: vars.limitOdds }),
      }),
  );
}

export function useCreatePick() {
  return useInvalidatingMutation(
    (vars: { gameId: string; type: 'MONEYLINE' | 'SPREAD'; side: 'HOME' | 'AWAY'; stake: number }) =>
      api<GamePick>('/picks', { method: 'POST', body: JSON.stringify(vars) }),
  );
}

export function useCancelOrder() {
  return useInvalidatingMutation((orderId: string) =>
    api<{ refunded: number }>(`/picks/orders/${orderId}/cancel`, { method: 'POST' }),
  );
}
