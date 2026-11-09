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

export function formatPts(n: number): string {
  return `${n.toLocaleString()} pts`;
}

export function signedPts(n: number): string {
  const abs = Math.abs(n).toLocaleString();
  if (n > 0) return `+${abs} pts`;
  if (n < 0) return `−${abs} pts`;
  return '0 pts';
}

export function formatTimeET(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export function formatDateShort(iso: string): string {
  const date = new Date(iso);
  const month = date.toLocaleString('en-US', { timeZone: 'America/New_York', month: 'short' });
  const day = date.toLocaleString('en-US', { timeZone: 'America/New_York', day: '2-digit' });
  const time = date.toLocaleTimeString('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${month} ${day} · ${time}`;
}

export function estimatePayout(stake: number, odds: number): number {
  return stake + Math.round(stake * profitMultiplier(odds));
}

export function liabilityFor(stake: number, odds: number): number {
  return Math.round(stake * profitMultiplier(odds));
}
