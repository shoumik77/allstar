import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'h-11 w-full rounded-none border-2 border-ink bg-paper-sunken px-3 text-sm text-ink shadow-[inset_2px_2px_0_0_rgba(43,35,32,0.15)] placeholder:text-ink-faint focus-visible:outline-none focus-visible:bg-paper-raised focus-visible:ring-2 focus-visible:ring-varsity disabled:opacity-40',
      className,
    )}
    {...props}
  />
));
Input.displayName = 'Input';
