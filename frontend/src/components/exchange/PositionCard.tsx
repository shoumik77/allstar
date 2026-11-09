import { Link } from 'react-router-dom';
import { formatAmerican, formatPts, signedPts } from '@/lib/format';
import { teamFor } from '@/lib/teams';
import type { MyOrder } from '@/lib/types';
import type { PositionSummary } from '@/lib/positions';
import { StatusDot } from '@/components/ui/status-dot';
import { cn } from '@/lib/utils';

export function PositionCard({ order, position }: { order: MyOrder; position: PositionSummary }) {
  const game = order.pick.game;
  const team = teamFor(order.pick.side === 'HOME' ? game.homeTeam : game.awayTeam);
  const away = teamFor(game.awayTeam);
  const home = teamFor(game.homeTeam);
  const live = game.status === 'IN_PROGRESS';
  const kickoff = new Date(game.kickoff)
    .toLocaleString('en-US', { timeZone: 'America/New_York', weekday: 'short', hour: 'numeric', minute: '2-digit' })
    .toUpperCase()
    .replace(/,/, '');
  const partially = position.status === 'MIXED';
  const explainer =
    position.side === 'WITH'
      ? `${team.nickname} wins: ${signedPts(position.potentialProfit)}. ${team.nickname} loses: −${position.maxLoss.toLocaleString()} pts. A push voids the bet and returns exposure.`
      : `${team.nickname} loses: ${signedPts(position.potentialProfit)}. ${team.nickname} wins: −${position.maxLoss.toLocaleString()} pts. A push voids the bet and returns exposure.`;

  return (
    <div className="flex flex-col gap-4 border border-parchment p-6">
      <div className="flex items-center justify-between">
        <p className={cn('label', position.side === 'WITH' ? 'text-forest' : 'text-burgundy')}>
          {position.side} · {order.pick.type}
        </p>
        <StatusDot state={live ? 'live' : 'filled'} label={live ? 'LIVE' : 'MATCHED'} />
      </div>
      <p className="font-condensed text-[12px] uppercase tracking-[0.02em] text-muted">
        {away.abbrev} @ {home.abbrev} · {kickoff} ET
      </p>
      <h3 className="font-serif text-[32px] leading-tight">
        {team.city} {team.nickname}
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="label text-muted">MATCHED STAKE</p>
          <p className="numeral mt-1 text-[30px] leading-none">{formatPts(position.matchedStake)}</p>
        </div>
        <div>
          <p className="label text-muted">AVG. ODDS</p>
          <p className="numeral mt-1 text-[30px] leading-none">
            {position.matchedStake > 0 ? formatAmerican(position.avgOdds) : '—'}
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 border-t border-parchment pt-3">
        <div className="flex justify-between text-[12px]">
          <span className="text-muted">Maximum loss / exposure</span>
          <span className="font-mono">{formatPts(position.maxLoss)}</span>
        </div>
        <div className="flex justify-between text-[12px]">
          <span className="text-muted">Potential profit</span>
          <span className="font-mono text-forest">{signedPts(position.potentialProfit)}</span>
        </div>
        <div className="flex justify-between text-[12px]">
          <span className="text-muted">Total funds returned if won</span>
          <span className="font-mono">{formatPts(position.maxLoss + position.potentialProfit)}</span>
        </div>
      </div>
      <p className="text-[11px] leading-[1.6] text-muted">{explainer}</p>
      <div className="mt-auto flex items-center justify-between border-t border-parchment pt-3">
        <p className="label text-muted">{partially ? 'PARTIALLY SETTLED' : 'AWAITING OFFICIAL RESULT'}</p>
        <Link to={`/markets/${game.id}?pick=${order.pickId}`} className="text-[13px] font-semibold text-forest hover:underline">
          View market ↗
        </Link>
      </div>
    </div>
  );
}
