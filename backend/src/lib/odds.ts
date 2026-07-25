// American odds helpers. Profit multiplier = profit per 1 unit staked.
export function profitMultiplier(americanOdds: number): number {
  if (americanOdds === 0) throw new Error('American odds cannot be 0');
  return americanOdds > 0 ? americanOdds / 100 : 100 / Math.abs(americanOdds);
}

export function impliedProbability(americanOdds: number): number {
  return americanOdds > 0 ? 100 / (americanOdds + 100) : Math.abs(americanOdds) / (Math.abs(americanOdds) + 100);
}

export function formatAmerican(americanOdds: number): string {
  return americanOdds > 0 ? `+${americanOdds}` : `${americanOdds}`;
}

// Approximate moneyline for a given home spread, used by the mock provider and
// as a fallback when a book only publishes a spread.
const SPREAD_TO_FAVORITE_ML: Array<[number, number]> = [
  [1, -110],
  [1.5, -120],
  [2, -130],
  [2.5, -140],
  [3, -160],
  [3.5, -190],
  [4, -210],
  [4.5, -230],
  [5, -250],
  [5.5, -260],
  [6, -280],
  [6.5, -300],
  [7, -340],
  [7.5, -380],
  [8, -420],
  [9, -450],
  [10, -550],
  [11, -650],
  [13, -900],
];

export function moneylineForSpread(spread: number): { favorite: number; underdog: number } {
  const magnitude = Math.abs(spread);
  const entry = SPREAD_TO_FAVORITE_ML.find(([threshold]) => magnitude <= threshold);
  const favorite = entry ? entry[1] : -1200;
  // Give the dog a slightly worse price than fair to emulate book vig.
  const underdog = Math.round((Math.abs(favorite) * 0.88) / 5) * 5;
  return { favorite, underdog };
}
