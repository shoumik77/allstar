import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse bg-parchment', className)} />;
}

export function MarketSkeleton() {
  return (
    <div className="flex flex-col gap-4 border border-parchment p-6" aria-busy="true" aria-label="Loading market data">
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-11 w-full" />
      <p className="label text-muted">LOADING MARKET DATA</p>
    </div>
  );
}
