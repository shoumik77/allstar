import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  'press inline-flex items-center justify-center gap-2 rounded-none border-2 border-ink font-pixel uppercase tracking-wide disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper',
  {
    variants: {
      variant: {
        default: 'bg-varsity text-paper-raised hover:bg-varsity-hover',
        outline: 'bg-paper-raised text-ink hover:bg-paper-sunken',
        ghost: 'border-transparent bg-transparent text-ink shadow-none hover:bg-paper-sunken active:translate-x-0 active:translate-y-0 active:shadow-none',
        danger: 'bg-ink text-paper-raised hover:bg-ink/85',
        field: 'bg-field text-paper-raised hover:bg-field-hover',
      },
      size: {
        default: 'h-11 px-4 text-[11px]',
        sm: 'h-9 px-3 text-[9px]',
        lg: 'h-12 px-6 text-xs',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => (
  <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
));
Button.displayName = 'Button';
