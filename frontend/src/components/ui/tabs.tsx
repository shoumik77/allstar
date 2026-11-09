import { cn } from '@/lib/utils';

export type TabItem = { id: string; label: string; count?: number };

export function Tabs({
  items,
  value,
  onChange,
  className,
}: {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={cn('flex gap-6 overflow-x-auto whitespace-nowrap border-b border-parchment [scrollbar-width:none] [&::-webkit-scrollbar]:hidden', className)} role="tablist">
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={cn(
              '-mb-px border-b-2 border-transparent pb-3 text-[13px] transition-colors',
              active ? 'border-forest font-semibold text-forest' : 'text-muted hover:text-ink',
            )}
          >
            {item.label}
            {item.count !== undefined && <span className="numeral ml-1.5 text-[12px]">{item.count}</span>}
          </button>
        );
      })}
    </div>
  );
}
