import { cn } from '@/lib/utils';
import { teamFor } from '@/lib/teams';

const sizes = {
  38: 'h-[38px] w-[38px] text-[13px]',
  42: 'h-[42px] w-[42px] text-[14px]',
  48: 'h-[48px] w-[48px] text-[15px]',
  56: 'h-[56px] w-[56px] text-[17px]',
} as const;

export function TeamMark({
  team,
  size = 42,
  onDark,
  className,
}: {
  team: string;
  size?: keyof typeof sizes;
  onDark?: boolean;
  className?: string;
}) {
  const { abbrev } = teamFor(team);
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center border font-mono font-semibold',
        onDark ? 'border-forest-rule text-cream' : 'border-parchment text-ink',
        sizes[size],
        className,
      )}
    >
      {abbrev}
    </span>
  );
}
