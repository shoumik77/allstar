import { profitMultiplier } from './odds.js';

export const MIN_STAKE = 10;
export const MAX_STAKE_BALANCE_FRACTION = 0.25;

export function maxStakeFor(availableBalance: number): number {
  return Math.floor(availableBalance * MAX_STAKE_BALANCE_FRACTION);
}

export type EffectiveStake = {
  /** Portion of the stake whose odds-fair profit the opposite pool can cover. */
  matchedStake: number;
  /** Profit (not including stake back) achievable given the current opposite pool. */
  maxWin: number;
  /** Stake earning nothing because the other side can't cover it. */
  unmatchedStake: number;
  /** True when a meaningful share of the stake is unmatched. */
  overStaked: boolean;
};

/**
 * Payouts are pinned to the snapshotted odds, so a side's total target profit is
 * `sum(stake * multiplier)`. That target is capped by the opposite pool, and the
 * shortfall is shared pro-rata — which means an individual staker is matched by
 * the same ratio as their side overall.
 */
export function computeEffectiveStake(params: {
  stake: number;
  sideOdds: number;
  sidePoolIncludingStake: number;
  oppositePool: number;
}): EffectiveStake {
  const { stake, sideOdds, sidePoolIncludingStake, oppositePool } = params;
  const multiplier = profitMultiplier(sideOdds);
  const sideTargetProfit = sidePoolIncludingStake * multiplier;

  const coverage = sideTargetProfit === 0 ? 1 : Math.min(1, oppositePool / sideTargetProfit);
  const matchedStake = Math.floor(stake * coverage);
  const maxWin = Math.floor(stake * multiplier * coverage);

  return {
    matchedStake,
    maxWin,
    unmatchedStake: stake - matchedStake,
    overStaked: coverage < 0.9,
  };
}

export function poolTotals(positions: Array<{ side: 'WITH' | 'AGAINST'; stake: number }>): {
  withPool: number;
  againstPool: number;
} {
  return positions.reduce(
    (acc, p) => {
      if (p.side === 'WITH') acc.withPool += p.stake;
      else acc.againstPool += p.stake;
      return acc;
    },
    { withPool: 0, againstPool: 0 },
  );
}
