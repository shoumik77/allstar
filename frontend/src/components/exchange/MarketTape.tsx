import { tapeFor } from '@/lib/book';
import { formatAmerican, formatTimeET } from '@/lib/format';
import { teamFor } from '@/lib/teams';
import type { GamePick } from '@/lib/types';
import { cn } from '@/lib/utils';

export function MarketTape({ pick }: { pick: GamePick }) {
  const rows = tapeFor(pick);
  const team = teamFor(pick.side === 'HOME' ? pick.game.homeTeam : pick.game.awayTeam);

  return (
    <div className="flex flex-col gap-2">
      <p className="font-condensed text-[13px] font-semibold uppercase tracking-[0.02em] text-parchment">
        RECENT TRADES · MARKET TAPE
      </p>
      {rows.length === 0 ? (
        <p className="border-b border-forest-rule py-4 font-mono text-[12px] text-parchment/60">No trades yet.</p>
      ) : (
        <div className="w-full text-[12px]">
          <div className="flex h-10 items-center gap-3 border-b border-forest-rule font-condensed text-parchment">
            <span className="w-[92px]">TIME ET</span>
            <span className="flex-1">TEAM</span>
            <span className="flex-1">TAKER SIDE</span>
            <span className="flex-1">PRICE</span>
            <span className="flex-1 text-right">STAKE</span>
          </div>
          {rows.map((row, i) => (
            <div key={i} className="flex min-h-[58px] items-center gap-3 border-b border-forest-rule">
              <span className="w-[92px] font-mono text-cream">{formatTimeET(row.time)}</span>
              <span className="flex-1 text-cream">{team.abbrev}</span>
              <span className={cn('flex-1', row.takerSide === 'WITH' ? 'text-mint' : 'text-rose')}>{row.takerSide}</span>
              <span className="flex-1 font-mono text-cream">{formatAmerican(row.odds)}</span>
              <span className="flex-1 text-right font-mono text-cream">{row.withStake.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
