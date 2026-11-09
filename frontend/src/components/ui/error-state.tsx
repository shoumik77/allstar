import { Button } from './button';

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col gap-4 border-l-4 border-burgundy bg-cream p-6" role="alert">
      <p className="label text-burgundy">Something went wrong</p>
      <p className="text-[13px] text-ink">{message}</p>
      <div>
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      </div>
    </div>
  );
}
