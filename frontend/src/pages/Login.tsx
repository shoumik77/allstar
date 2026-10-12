import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Loader2, LogIn } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { tokenStore } from '@/lib/api';
import { EntryShell } from '@/components/EntryShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (tokenStore.access) return <Navigate to="/feed" replace />;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/feed', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <EntryShell className="flex flex-col items-center justify-center">
      <div className="w-full max-w-sm border-4 border-ink bg-paper-raised text-ink shadow-hard-gold-xl">
        <div className="flex items-center gap-2 border-b-4 border-ink bg-varsity px-5 py-3 font-pixel text-[10px] uppercase text-paper-raised">
          <LogIn className="h-4 w-4" />
          Sign in
        </div>
        <div className="p-5">
          <p className="mb-4 text-sm text-ink-soft">Back for another week? Stake your 1,000 points.</p>
          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            {error && (
              <p className="border-2 border-varsity bg-paper-sunken p-2 font-pixel text-[9px] uppercase leading-relaxed text-varsity">
                {error}
              </p>
            )}
            <Button type="submit" variant="gold" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Sign in
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-ink-soft">
            No account?{' '}
            <Link to="/register" className="font-pixel text-[10px] uppercase text-varsity underline">
              New player
            </Link>
          </p>
        </div>
      </div>
      <Link to="/" className="mt-6 font-pixel text-[9px] uppercase text-gold-bright hover:underline">
        ← Back to field
      </Link>
    </EntryShell>
  );
}
