import { buildLevels, type BookLevel } from '@/lib/book';
import { formatAmerican } from '@/lib/format';
import type { Order, OrderSide } from '@/lib/types';
import { cn } from '@/lib/utils';

function DepthRow({ level, columnMax, best, side }: { level: BookLevel; columnMax: number; best: boolean; side: OrderSide }) {
  return (
    <div
      className={cn(
        'relative flex h-12 items-center gap-[10px] overflow-hidden border-b border-forest-rule px-3',
        best && (side === 'WITH' ? 'border-l-2 border-t border-mint' : 'border-l-2 border-t border-rose'),
      )}
    >
      <div
        className={cn('absolute right-0 top-0 h-full', side === 'WITH' ? 'bg-forest' : 'bg-burgundy')}
        style={{ width: `${(level.cumulative / Math.max(1, columnMax)) * 100}%`, opacity: 0.55 }}
        aria-hidden
      />
      <span className={cn('relative z-10 flex-1 font-mono text-[20px]', side === 'WITH' ? 'text-mint' : 'text-rose')}>
        {formatAmerican(level.odds)}
      </span>
      <span className="relative z-10 flex-1 text-right font-mono text-[13px] text-cream">
        {level.remaining.toLocaleString()}
      </span>
      <span className="relative z-10 flex-1 text-right font-mono text-[13px] text-cream">
        {level.cumulative.toLocaleString()}
      </span>
    </div>
  );
}

function BookColumn({ orders, side, maxLevels = 6 }: { orders: Order[]; side: OrderSide; maxLevels?: number }) {
  const levels = buildLevels(orders, side, maxLevels);
  const isWith = side === 'WITH';
  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-start justify-between py-3">
        <p className={cn('font-condensed text-[20px] font-semibold', isWith ? 'text-mint' : 'text-rose')}>{side}</p>
        <p className="font-condensed text-[13px] text-parchment">{isWith ? 'BACK THE WIN' : 'OPPOSE THE WIN'}</p>
      </div>
      <div className="flex gap-[10px] px-3 pb-3 font-condensed text-[12px] text-parchment">
        <span className="flex-1">PRICE</span>
        <span className="flex-1 text-right">{isWith ? 'STAKE' : 'LIAB'}</span>
        <span className="flex-1 text-right">CUM.</span>
      </div>
      {levels.length === 0 ? (
        <div className="border-b border-forest-rule px-3 py-4 font-mono text-[12px] text-parchment/60">
          No resting {isWith ? 'WITH' : 'AGAINST'} orders
        </div>
      ) : (
        levels.map((level) => (
          <DepthRow
            key={level.odds}
            level={level}
            columnMax={levels[levels.length - 1]!.cumulative}
            best={level === levels[0]}
            side={side}
          />
        ))
      )}
    </div>
  );
}

export function OrderBook({ orders, maxLevels = 6 }: { orders: Order[]; maxLevels?: number }) {
  return (
    <div>
      <div className="flex gap-4">
        <BookColumn orders={orders} side="WITH" maxLevels={maxLevels} />
        <BookColumn orders={orders} side="AGAINST" maxLevels={maxLevels} />
      </div>
      <div className="mt-3 flex flex-col gap-1 text-[11px] text-parchment/60 md:flex-row md:items-center md:justify-between">
        <p>Best available first. Equal prices match oldest orders first.</p>
        <p className="font-condensed uppercase tracking-[0.02em]">TOP {maxLevels} LEVELS / SIDE</p>
      </div>
    </div>
  );
}
