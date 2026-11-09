import { cn } from '@/lib/utils';

export type StatusState = 'pregame' | 'live' | 'partial' | 'filled' | 'cancelled' | 'final' | 'void';

const styles: Record<StatusState, { dot: string; label: string }> = {
  pregame: { dot: 'bg-gold', label: 'Pregame' },
  live: { dot: 'bg-mint', label: 'Live' },
  partial: { dot: 'bg-gold', label: 'Partial' },
  filled: { dot: 'bg-forest', label: 'Filled' },
  cancelled: { dot: 'bg-burgundy', label: 'Cancelled' },
  final: { dot: 'bg-muted', label: 'Final' },
  void: { dot: 'bg-muted', label: 'Void' },
};

export function StatusDot({ state, label, className }: { state: StatusState; label?: string; className?: string }) {
  const style = styles[state];
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className={cn('h-1 w-1', style.dot)} aria-hidden />
      <span className="font-condensed text-[12px] uppercase tracking-[0.02em] text-muted">{label ?? style.label}</span>
    </span>
  );
}
