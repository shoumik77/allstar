import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-[2px] font-sans font-semibold transition-colors disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-cream',
  {
    variants: {
      variant: {
        primary: 'bg-forest text-cream hover:bg-forest/90',
        secondary: 'border border-ink bg-cream text-ink hover:bg-parchment',
        destructive: 'bg-burgundy text-cream hover:bg-burgundy/90',
        gold: 'bg-gold text-ink hover:bg-gold/90',
        ghost: 'bg-transparent text-ink hover:bg-parchment',
        link: 'text-burgundy underline-offset-2 hover:underline',
      },
      size: {
        md: 'h-[46px] px-5 text-[13px]',
        sm: 'h-9 px-3 text-[12px]',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => (
  <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
));
Button.displayName = 'Button';
