import { useState } from 'react';
import { downloadCsv, toCsv } from '@/lib/ledger';
import { useTransactions } from '@/lib/queries';
import type { TransactionType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { TransactionsTable, TX_CSV_HEADERS, transactionCsvRows } from '@/components/exchange/TransactionsTable';

const TYPES: TransactionType[] = [
  'STAKE',
  'REFUND',
  'PAYOUT',
  'SETTLEMENT_LOSS',
  'ORDER_CANCEL',
  'UNMATCHED_REFUND',
  'WEEKLY_RESET',
];

export function ActivityPage() {
  const [page, setPage] = useState(1);
  const [type, setType] = useState<'ALL' | TransactionType>('ALL');
  const transactions = useTransactions({ page, limit: 50, type: type === 'ALL' ? undefined : type });

  const items = transactions.data?.items ?? [];
  const pagination = transactions.data?.pagination;

  return (
    <div className="flex flex-col gap-7 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label text-muted">LEDGER / ACCOUNT ACTIVITY</p>
          <h2 className="mt-1 font-serif text-[44px] leading-none md:text-[56px]">Every point, in order.</h2>
          <p className="mt-3 max-w-xl text-[13px] leading-[1.7] text-muted">
            The complete record of reservations, returns, and settlements on your account.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => downloadCsv('allstar-activity.csv', toCsv(TX_CSV_HEADERS, transactionCsvRows(items)))}
        >
          Export activity ↓
        </Button>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Select
          value={type}
          onChange={(e) => {
            setType(e.target.value as 'ALL' | TransactionType);
            setPage(1);
          }}
          className="w-48"
          aria-label="Transaction type filter"
        >
          <option value="ALL">ALL TRANSACTIONS</option>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t.replace(/_/g, ' ')}
            </option>
          ))}
        </Select>
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              ← Prev
            </Button>
            <span className="font-mono text-[12px] text-muted">
              Page {pagination.page} of {pagination.pages}
            </span>
            <Button variant="secondary" size="sm" disabled={page >= pagination.pages} onClick={() => setPage(page + 1)}>
              Next →
            </Button>
          </div>
        )}
      </div>

      {transactions.isLoading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : transactions.isError ? (
        <ErrorState message="Activity could not be loaded." onRetry={() => void transactions.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState compact title="No ledger entries yet." body="Transactions appear as you trade." />
      ) : (
        <>
          <div className="hidden md:block">
            <TransactionsTable items={items} />
          </div>
          <div className="flex flex-col gap-3 md:hidden">
            <TransactionsTable items={items} mobileCards />
          </div>
        </>
      )}
    </div>
  );
}
