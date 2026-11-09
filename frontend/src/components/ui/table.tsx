import { cn } from '@/lib/utils';

type CellProps = React.TdHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean };
type HeadCellProps = React.ThHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean };

export function Table({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return <table className={cn('w-full border-collapse text-left', className)} {...props} />;
}

export function THead({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn(className)} {...props} />;
}

export function TH({ className, numeric, ...props }: HeadCellProps) {
  return <th className={cn('label font-normal text-muted', numeric && 'numeral text-right', className)} {...props} />;
}

export function TBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn(className)} {...props} />;
}

export function TR({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn('min-h-[58px] border-b border-parchment text-[12px] leading-[1.5]', className)} {...props} />;
}

export function TD({ className, numeric, ...props }: CellProps) {
  return <td className={cn('py-3 pr-3 align-middle', numeric && 'numeral text-right', className)} {...props} />;
}
