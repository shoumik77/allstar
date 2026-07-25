export function formatAmerican(odds: number | null | undefined): string {
  if (odds === null || odds === undefined) return '—';
  return odds > 0 ? `+${odds}` : `${odds}`;
}

export function formatSpread(spread: number | null | undefined): string {
  if (spread === null || spread === undefined) return '—';
  return spread > 0 ? `+${spread}` : `${spread}`;
}

export function profitMultiplier(americanOdds: number): number {
  return americanOdds > 0 ? americanOdds / 100 : 100 / Math.abs(americanOdds);
}

export function formatKickoff(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatPoints(points: number): string {
  return points.toLocaleString();
}
