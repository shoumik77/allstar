import { remainingOf } from './book';
import type { MatchResult, MyOrder, OrderSide } from './types';

export type PositionStatus = 'PENDING' | 'WON' | 'LOST' | 'PUSH' | 'MIXED';

export type PositionSummary = {
  pickId: string;
  side: OrderSide;
  /** Σ of this side's matched amount (WITH→withStake, AGAINST→againstLiability). */
  matchedStake: number;
  /** Own-stake-weighted mean of match odds, rounded to integer. */
  avgOdds: number;
  /** Σ counterparty amount over PENDING matches. */
  potentialProfit: number;
  /** Σ own amount over PENDING matches. */
  maxLoss: number;
  /** Σ own amount over settled matches (WON/LOST; excludes PENDING and PUSH). */
  settledExposure: number;
  /** Settled P&L: +counterparty on wins, −own on losses, 0 on pushes. */
  realized: number;
  status: PositionStatus;
  /** Unmatched remainder still reserved on the book. */
  unmatched: number;
};

type MatchLite = MyOrder['withMatches'][number];

function outcomeFor(side: OrderSide, result: MatchResult): 'WON' | 'LOST' | 'PUSH' | 'PENDING' {
  if (result === 'PENDING') return 'PENDING';
  if (result === 'PUSH') return 'PUSH';
  const won = side === 'WITH' ? result === 'WITH_WON' : result === 'AGAINST_WON';
  return won ? 'WON' : 'LOST';
}

export function summarizePositions(orders: MyOrder[]): PositionSummary[] {
  const groups = new Map<string, MyOrder[]>();
  for (const order of orders) {
    const key = `${order.pickId}:${order.side}`;
    const group = groups.get(key) ?? [];
    group.push(order);
    groups.set(key, group);
  }

  const summaries: PositionSummary[] = [];
  for (const group of groups.values()) {
    const side = group[0]!.side;
    const matches: MatchLite[] = group.flatMap((order) =>
      side === 'WITH' ? order.withMatches : order.againstMatches,
    );

    const ownAmount = (m: MatchLite) => (side === 'WITH' ? m.withStake : m.againstLiability);
    const counterAmount = (m: MatchLite) => (side === 'WITH' ? m.againstLiability : m.withStake);

    let matchedStake = 0;
    let oddsWeighted = 0;
    let potentialProfit = 0;
    let maxLoss = 0;
    let settledExposure = 0;
    let realized = 0;
    const outcomes = new Set<'WON' | 'LOST' | 'PUSH' | 'PENDING'>();

    for (const match of matches) {
      const own = ownAmount(match);
      matchedStake += own;
      oddsWeighted += match.odds * own;
      const outcome = outcomeFor(side, match.result);
      outcomes.add(outcome);
      if (outcome === 'PENDING') {
        maxLoss += own;
        potentialProfit += counterAmount(match);
      } else if (outcome === 'WON') {
        settledExposure += own;
        realized += counterAmount(match);
      } else if (outcome === 'LOST') {
        settledExposure += own;
        realized -= own;
      }
    }

    const status: PositionStatus = outcomes.size === 0 ? 'PENDING' : outcomes.size === 1 ? ([...outcomes][0] as PositionStatus) : 'MIXED';

    summaries.push({
      pickId: group[0]!.pickId,
      side,
      matchedStake,
      avgOdds: matchedStake > 0 ? Math.round(oddsWeighted / matchedStake) : 0,
      potentialProfit,
      maxLoss,
      settledExposure,
      realized,
      status,
      unmatched: group.reduce((sum, order) => sum + remainingOf(order), 0),
    });
  }

  return summaries;
}
