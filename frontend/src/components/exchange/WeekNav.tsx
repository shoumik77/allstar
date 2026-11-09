import { cn } from '@/lib/utils';

function rangeLabel(week?: { startsAt: string; endsAt: string }): string {
  if (!week) return '';
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).toUpperCase();
  return `${fmt(week.startsAt)}–${fmt(week.endsAt)}`;
}

export function WeekNav({
  week,
  weekNumber,
  onChange,
  className,
}: {
  week?: { startsAt: string; endsAt: string };
  weekNumber: number;
  onChange: (week: number) => void;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center border border-parchment px-4 py-3', className)}>
      <button
        onClick={() => onChange(weekNumber - 1)}
        disabled={weekNumber <= 1}
        aria-label="Previous week"
        className="px-2 text-[15px] disabled:opacity-30"
      >
        ←
      </button>
      <span className="px-3 font-mono text-[13px]">
        WEEK {String(weekNumber).padStart(2, '0')} · {rangeLabel(week)}
      </span>
      <button
        onClick={() => onChange(weekNumber + 1)}
        disabled={weekNumber >= 22}
        aria-label="Next week"
        className="px-2 text-[15px] disabled:opacity-30"
      >
        →
      </button>
    </div>
  );
}
