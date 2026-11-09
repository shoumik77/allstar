import { cn } from '@/lib/utils';

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  onDark,
  className,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  tone?: 'with-against';
  onDark?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('flex gap-2', className)} role="group">
      {options.map((option) => {
        const selected = option.id === value;
        const selectedClass =
          option.id === 'WITH'
            ? 'bg-forest text-cream'
            : option.id === 'AGAINST'
              ? 'bg-burgundy text-cream'
              : 'bg-ink text-cream';
        return (
          <button
            key={option.id}
            aria-pressed={selected}
            onClick={() => onChange(option.id)}
            className={cn(
              'h-[46px] flex-1 rounded-[2px] font-condensed text-[15px] font-semibold uppercase tracking-[0.02em] transition-colors',
              selected
                ? selectedClass
                : onDark
                  ? 'border border-forest-rule text-rose hover:text-cream'
                  : 'border border-parchment text-muted hover:text-ink',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
