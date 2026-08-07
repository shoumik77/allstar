import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { tokenStore } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (tokenStore.access) return <Navigate to="/feed" replace />;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(email, username, password);
      navigate('/feed', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xs">Create your account</CardTitle>
          <CardDescription>Start each week with 1,000 points.</CardDescription>
        </CardHeader>
        <CardContent>
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
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              minLength={3}
              maxLength={20}
              required
            />
            <Input
              type="password"
              placeholder="Password (8+ characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
            {error && (
              <p className="border-2 border-varsity bg-paper-sunken p-2 font-pixel text-[9px] uppercase leading-relaxed text-varsity">
                {error}
              </p>
            )}
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Create account
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-ink-soft">
            Already have an account?{' '}
            <Link to="/login" className="font-pixel text-[10px] uppercase text-varsity underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
