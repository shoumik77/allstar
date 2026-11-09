import { cn } from '@/lib/utils';

export type StatTileProps = {
  label: string;
  value: string;
  caption?: string;
  tone?: 'cream' | 'dark' | 'forest';
  valueTone?: 'default' | 'positive' | 'negative';
  className?: string;
};

const toneClasses = {
  cream: 'border-parchment bg-cream text-ink',
  dark: 'border-forest-rule bg-ink text-cream',
  forest: 'border-forest-rule bg-forest text-cream',
} as const;

const valueToneClasses = {
  cream: { positive: 'text-forest', negative: 'text-burgundy' },
  dark: { positive: 'text-mint', negative: 'text-rose' },
  forest: { positive: 'text-mint', negative: 'text-rose' },
} as const;

export function StatTile({ label, value, caption, tone = 'cream', valueTone = 'default', className }: StatTileProps) {
  return (
    <div className={cn('flex flex-col gap-1 border p-5', toneClasses[tone], className)}>
      <span className="label text-muted">{label}</span>
      <span
        className={cn(
          'numeral text-[30px] leading-none',
          valueTone !== 'default' && valueToneClasses[tone][valueTone],
        )}
      >
        {value}
      </span>
      {caption && <span className="text-[11px] leading-[1.5] text-muted">{caption}</span>}
    </div>
  );
}
