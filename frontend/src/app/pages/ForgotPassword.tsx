/**
 * @file ForgotPassword.tsx
 * @description Password reset request page. Route: /forgot-password
 *
 * Calls POST /auth/forgot-password { email } → Supabase sends a reset email.
 * Supabase enforces a 60-second rate limit per email address — the UI shows
 * a live countdown so users know when they can retry.
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://api.uomcc.org';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RATE_LIMIT_SECONDS = 60;

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Count down from 60 after each send
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!EMAIL_REGEX.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    setLoading(true);
    try {
      await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      // Always treat as success — Supabase never confirms whether the email exists
      setSubmitted(true);
      setCountdown(RATE_LIMIT_SECONDS);
    } catch {
      toast.error('Could not reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">

      <img
        src="/assets/Looking%20Down.png"
        alt="Looking down"
        className="h-36 w-36 object-contain mb-2"
      />

      {submitted ? (
        <div className="max-w-sm space-y-4">
          <h2 className="text-xl">Check your inbox</h2>
          <p className="text-muted-foreground text-sm">
            If an account exists for <strong>{email}</strong>, a password reset
            link is on its way. Check your spam folder if you don't see it within
            a minute.
          </p>

          {/* Rate-limit countdown */}
          {countdown > 0 ? (
            <p className="text-xs text-muted-foreground">
              You can request another link in{' '}
              <span className="tabular-nums font-medium text-foreground">{countdown}s</span>
            </p>
          ) : (
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="text-sm text-primary underline underline-offset-4"
            >
              Send another link
            </button>
          )}

          <div className="pt-2">
            <Link to="/" className="text-sm text-muted-foreground underline underline-offset-4">
              Back to home
            </Link>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-sm space-y-5">
          <div>
            <h2 className="text-xl mb-1">Forgot your password?</h2>
            <p className="text-sm text-muted-foreground">
              Enter your account email and we'll send you a reset link.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@uoregon.edu"
                required
                autoComplete="email"
              />
            </div>

            <Button type="submit" className="w-full bg-primary" disabled={loading}>
              {loading ? 'Sending…' : 'Send Reset Link'}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Reset emails are limited to one every 60 seconds.
            </p>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Remembered it?{' '}
            <Link to="/" className="text-primary underline underline-offset-4">
              Back to home
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
