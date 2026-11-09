import { Button } from './button';
import { cn } from '@/lib/utils';

export function EmptyState({
  title,
  body,
  action,
  compact,
  tone = 'cream',
  className,
}: {
  title: string;
  body: string;
  action?: { label: string; onClick: () => void };
  compact?: boolean;
  tone?: 'cream' | 'dark';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-start gap-3 border',
        compact ? 'p-5' : 'gap-4 p-7',
        tone === 'dark' ? 'border-forest-rule' : 'border-parchment',
        className,
      )}
    >
      <span className={cn('leading-none text-forest', compact ? 'text-[22px]' : 'text-[30px]', tone === 'dark' && 'text-mint')} aria-hidden>
        ☆
      </span>
      <h3 className={cn('font-serif leading-tight', compact ? 'text-[24px]' : 'text-[32px]', tone === 'dark' ? 'text-cream' : 'text-ink')}>
        {title}
      </h3>
      <p className={cn('text-[12px] leading-[1.7]', tone === 'dark' ? 'text-parchment/70' : 'text-muted')}>{body}</p>
      {action && (
        <Button variant="primary" size={compact ? 'sm' : 'md'} onClick={action.onClick}>
          {action.label} →
        </Button>
      )}
    </div>
  );
}
