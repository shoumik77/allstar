import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, KeyRound, Loader2, Swords, Target, Trophy } from 'lucide-react';
import { accessStore, verifyAccessCode } from '@/lib/access';
import { EntryShell } from '@/components/EntryShell';
import { buttonVariants, Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const steps = [
  {
    icon: Target,
    tile: 'bg-varsity',
    title: 'Call your shot',
    body: 'Pick a side on any NFL game — moneyline or spread — at odds locked the moment you post.',
  },
  {
    icon: Swords,
    tile: 'bg-field',
    title: 'Find your fade',
    body: 'Friends stake with you or against you. No house, no vig. Just the other side of the paper.',
  },
  {
    icon: Trophy,
    tile: 'bg-gold-bright',
    title: 'Settle up Tuesday',
    body: 'Games go final, points pay out by the odds, the board ranks everyone. Then it all resets.',
  },
];

const stats = [
  { value: '1,000', label: 'pts / week' },
  { value: '0%', label: 'vig' },
  { value: 'P2P', label: 'odds' },
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
      <div className="grid items-start gap-10 md:grid-cols-[1.35fr_1fr] md:gap-14">
        <section className="order-2 md:order-1">
          <span className="inline-block border-2 border-gold-bright px-3 py-1.5 font-pixel text-[9px] uppercase text-gold-bright">
            Season 2026 · Now accepting players
          </span>

          <h1
            className="mt-6 break-words font-pixel text-5xl uppercase leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl"
            style={{ textShadow: '5px 5px 0 #082416' }}
          >
            All
            <br />
            <span className="text-gold-bright">Star</span>
            <span className="ml-3 inline-block align-top text-2xl text-varsity sm:text-3xl">★</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-chalk-soft">
            Peer-to-peer NFL picks. You call it, your friends fade it, the scoreboard settles it. Everyone
            starts the week with 1,000 points — Tuesday morning it all resets.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {stats.map(({ value, label }) => (
              <div
                key={label}
                className="border-2 border-ink bg-turf-deep px-4 py-2 shadow-hard-gold"
              >
                <div className="font-pixel text-base leading-none text-gold-bright">{value}</div>
                <div className="mt-1.5 font-pixel text-[8px] uppercase text-chalk-soft">{label}</div>
              </div>
            ))}
          </div>

          <ol className="mt-10 grid gap-5 sm:grid-cols-3">
            {steps.map(({ icon: Icon, tile, title, body }, i) => (
              <li
                key={title}
                className="lift relative flex flex-col gap-3 border-2 border-ink bg-paper-raised p-4 pt-5 text-ink shadow-hard-gold"
              >
                <div className="flex items-start justify-between">
                  <span className="font-pixel text-[9px] text-ink-faint">0{i + 1}</span>
                  <span className={cn('flex h-9 w-9 items-center justify-center border-2 border-ink text-paper-raised shadow-hard-sm', tile)}>
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <h2 className="font-pixel text-[10px] uppercase leading-relaxed">{title}</h2>
                <p className="text-sm leading-snug text-ink-soft">{body}</p>
              </li>
            ))}
          </ol>
        </section>

        <aside className="order-1 w-full md:order-2 md:sticky md:top-10">
          <div className="border-4 border-ink bg-paper-raised text-ink shadow-hard-gold-xl">
            <div className="flex items-center gap-2 border-b-4 border-ink bg-varsity px-5 py-3 font-pixel text-[10px] uppercase text-paper-raised">
              <KeyRound className="h-4 w-4" />
              {granted ? 'Access granted' : 'Enter access code'}
            </div>

            <div className="p-5">
              {granted ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 border-2 border-field bg-field/10 p-3 font-pixel text-[9px] uppercase text-field">
                    <CheckCircle2 className="h-4 w-4" />
                    You're on the list
                  </div>
                  <Link to="/login" className={cn(buttonVariants({ variant: 'gold', size: 'lg' }), 'w-full')}>
                    Enter the app
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="flex flex-col gap-4">
                  <p className="text-sm text-ink-soft">This is a private league. Punch in the code you were given.</p>
                  <Input
                    placeholder="XXXX-XXXX"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    className="h-14 text-center font-pixel text-sm uppercase tracking-[0.3em] placeholder:tracking-[0.3em] placeholder:text-ink-faint/60"
                    required
                  />
                  {error && (
                    <p className="border-2 border-varsity bg-paper-sunken p-2 font-pixel text-[9px] uppercase leading-relaxed text-varsity">
                      {error}
                    </p>
                  )}
                  <Button type="submit" variant="gold" size="lg" disabled={submitting || !code.trim()}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : '▸'}
                    Press start
                  </Button>
                </form>
              )}
              <p className="mt-5 text-center text-sm text-ink-soft">Don't have a code? Ask whoever sent you here.</p>
            </div>
          </div>
        </aside>
      </div>
    </EntryShell>
  );
}
