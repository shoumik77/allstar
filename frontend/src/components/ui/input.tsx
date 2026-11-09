import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  unit?: string;
  tone?: 'cream' | 'dark';
};

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, unit, tone = 'cream', ...props }, ref) => {
  const input = (
    <input
      ref={ref}
      className={cn(
        'h-12 w-full min-w-0 rounded-[2px] border px-3 font-mono text-[18px] focus-visible:outline-none disabled:opacity-40',
        tone === 'dark'
          ? 'border-forest-rule bg-ink text-cream placeholder:text-parchment/50 focus-visible:border-mint'
          : 'border-parchment bg-cream text-ink placeholder:text-muted focus-visible:border-ink',
        
        className,
      )}
      {...props}
    />
  );

  if (!unit) return input;

  return (
    <div className="relative">
      {input}
      <span className={cn('pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 font-condensed text-[11px] uppercase', tone === 'dark' ? 'text-parchment/70' : 'text-muted')}>
        {unit}
      </span>
    </div>
  );
});
Input.displayName = 'Input';
