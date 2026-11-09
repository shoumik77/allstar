import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastVariant = 'success' | 'error';

type Toast = { id: number; variant: ToastVariant; title: string; body?: string };

const ToastContext = createContext<{ toast: (t: Omit<Toast, 'id'>) => void } | null>(null);

const DISMISS_MS = 6000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const toast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = nextId.current++;
    setToasts((current) => [...current, { ...t, id }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((existing) => existing.id !== id));
    }, DISMISS_MS);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed bottom-20 right-4 z-50 flex w-[340px] max-w-[92vw] flex-col gap-2 md:bottom-6 md:right-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 p-4 text-cream',
              t.variant === 'success' ? 'bg-forest' : 'bg-burgundy',
            )}
          >
            {t.variant === 'success' && <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold" />}
            <div className="min-w-0">
              <p className="text-[13px] font-semibold">{t.title}</p>
              {t.body && <p className="mt-0.5 text-[12px] leading-[1.5] opacity-80">{t.body}</p>}
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
