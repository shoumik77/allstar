import { ChevronDown } from 'lucide-react';
import { formatAmerican, formatSpread } from '@/lib/format';
import { teamFor } from '@/lib/teams';
import type { GamePick } from '@/lib/types';
import { cn } from '@/lib/utils';

export function pickOptionLabel(pick: GamePick): string {
  const team = teamFor(pick.side === 'HOME' ? pick.game.homeTeam : pick.game.awayTeam);
  const market = pick.type === 'MONEYLINE' ? 'ML' : `SPR ${formatSpread(pick.line)}`;
  return `${pick.creator.username} · ${market} · ${team.abbrev} ${formatAmerican(pick.sideOdds)}`;
}

export function PickSelector({
  picks,
  value,
  onChange,
  className,
}: {
  picks: GamePick[];
  value: string | undefined;
  onChange: (pickId: string) => void;
  className?: string;
}) {
  return (
    <div className={cn('relative inline-flex items-center', className)}>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 appearance-none border border-forest-rule bg-ink pl-3 pr-8 font-condensed text-[13px] font-semibold uppercase tracking-[0.02em] text-parchment focus-visible:border-mint focus-visible:outline-none"
        aria-label="Select pick"
      >
        {picks.map((pick) => (
          <option key={pick.id} value={pick.id}>
            {pickOptionLabel(pick)}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 h-4 w-4 text-parchment/70" />
    </div>
  );
}
