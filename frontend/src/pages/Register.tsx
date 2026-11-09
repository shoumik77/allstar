import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { tokenStore } from '@/lib/api';
import { EntryShell } from '@/components/EntryShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (tokenStore.access) return <Navigate to="/markets" replace />;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(email, username, password);
      navigate('/markets', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <EntryShell className="flex flex-col items-center justify-center">
      <div className="w-full max-w-[420px] border border-parchment border-t-4 border-t-gold bg-cream p-8">
        <p className="label text-forest">NEW ACCOUNT</p>
        <h1 className="mt-2 font-serif text-[36px] leading-[1.05]">Take a seat at the exchange.</h1>
        <p className="mt-2 text-[12px] leading-[1.6] text-muted">
          One account per player. Every week starts fresh at 1,000 points.
        </p>

        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="text-[12px] font-semibold text-ink">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="mt-1.5"
              required
            />
          </div>
          <div>
            <label htmlFor="username" className="text-[12px] font-semibold text-ink">
              Username
            </label>
            <Input
              id="username"
              placeholder="3–20 characters"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              minLength={3}
              maxLength={20}
              className="mt-1.5"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="text-[12px] font-semibold text-ink">
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="8+ characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              className="mt-1.5"
              required
            />
          </div>
          {error && (
            <p className="border-l-2 border-burgundy pl-3 text-[12px] leading-[1.5] text-burgundy">{error}</p>
          )}
          <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Create account
          </Button>
        </form>

        <p className="mt-5 text-center text-[12px] text-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-burgundy underline-offset-2 hover:underline">
            Sign in
          </Link>
        </p>
        <p className="mt-6 text-center font-condensed text-[11px] uppercase tracking-[0.02em] text-burgundy">
          SIMULATED FUNDS ONLY
        </p>
      </div>
      <Link to="/" className="mt-6 text-[12px] text-muted hover:text-ink">
        ← Back to the gate
      </Link>
    </EntryShell>
  );
}
