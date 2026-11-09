import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { accessStore, verifyAccessCode } from '@/lib/access';
import { EntryShell } from '@/components/EntryShell';
import { buttonVariants, Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const steps = [
  {
    n: '01',
    title: 'Call your shot.',
    body: 'Pick a side on any NFL game — moneyline or spread — at odds locked the moment you post.',
  },
  {
    n: '02',
    title: 'Find your fade.',
    body: 'Friends stake with you or against you. No house, no vig. Just the other side of the paper.',
  },
  {
    n: '03',
    title: 'Settle up Tuesday.',
    body: 'Games go final, points pay out by the odds, the board ranks everyone. Then it all resets.',
  },
];

export function HomePage() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const granted = accessStore.granted;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await verifyAccessCode(code);
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "That code didn't work");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <EntryShell>
      <div className="grid items-start gap-12 lg:grid-cols-[1.35fr_1fr] lg:gap-16">
        <section>
          <p className="label text-forest">THE PEER-TO-PEER SPORTS EXCHANGE</p>
          <h1 className="mt-4 font-serif text-[72px] uppercase leading-[0.95] tracking-tight md:text-[104px]">
            <span className="text-forest">★</span> Allstar
          </h1>
          <p className="mt-4 font-serif text-[28px] italic leading-snug text-muted md:text-[36px]">
            Every pick has two sides.
          </p>
          <p className="mt-6 max-w-xl text-[14px] leading-[1.7] text-muted">
            Peer-to-peer NFL picks. You call it, your friends fade it, the scoreboard settles it. Everyone
            starts the week with 1,000 points — Tuesday morning it all resets.
          </p>
          <p className="label mt-6 text-muted">1,000 PTS EVERY TUESDAY · NO HOUSE · NO VIG</p>

          <ol className="mt-12 grid gap-8 border-t border-parchment pt-8 sm:grid-cols-3">
            {steps.map(({ n, title, body }) => (
              <li key={n}>
                <p className="font-condensed text-[13px] font-semibold uppercase tracking-[0.02em] text-gold">
                  {n}
                </p>
                <h2 className="mt-2 font-serif text-[24px] leading-tight">{title}</h2>
                <p className="mt-2 text-[12px] leading-[1.7] text-muted">{body}</p>
              </li>
            ))}
          </ol>
        </section>

        <aside className="w-full lg:sticky lg:top-10">
          <div className="border border-parchment border-t-4 border-t-gold bg-cream p-7 md:p-8">
            <p className="label text-forest">{granted ? 'ACCESS GRANTED' : 'PRIVATE LEAGUE'}</p>
            <h2 className="mt-2 font-serif text-[32px] leading-[1.05]">
              {granted ? "You're on the list." : 'Punch in the code.'}
            </h2>

            {granted ? (
              <div className="mt-6 flex flex-col gap-5">
                <div className="flex items-center gap-3 border border-parchment bg-with-tint p-3">
                  <Check className="h-4 w-4 shrink-0 text-forest" />
                  <p className="text-[12px] leading-[1.5] text-forest">
                    Access granted for this device. Head to the sign-in page.
                  </p>
                </div>
                <Link to="/login" className={cn(buttonVariants({ variant: 'primary' }), 'w-full')}>
                  Enter the exchange
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
                <div>
                  <label htmlFor="access-code" className="text-[12px] font-semibold text-ink">
                    Access code
                  </label>
                  <Input
                    id="access-code"
                    placeholder="XXXX-XXXX"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    className="mt-1.5 text-center uppercase tracking-[0.25em] placeholder:tracking-[0.25em]"
                    required
                  />
                </div>
                {error && (
                  <p className="border-l-2 border-burgundy pl-3 text-[12px] leading-[1.5] text-burgundy">
                    {error}
                  </p>
                )}
                <Button type="submit" variant="primary" className="w-full" disabled={submitting || !code.trim()}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Request entry ↵
                </Button>
                <p className="text-center text-[12px] text-muted">
                  Don't have a code? Ask whoever sent you here.
                </p>
              </form>
            )}

            <p className="mt-7 text-center font-condensed text-[11px] uppercase tracking-[0.02em] text-burgundy">
              SIMULATED FUNDS ONLY
            </p>
          </div>
        </aside>
      </div>
    </EntryShell>
  );
}
