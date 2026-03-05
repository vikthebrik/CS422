/**
 * @file ForgotPassword.tsx
 * @description Password reset request page. Route: /forgot-password
 *
 * Calls POST /auth/forgot-password { email } which triggers a Supabase reset
 * email. The email contains a link to /reset-password.
 * Linked from LoginDialog.tsx.
 */
import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://api.uomcc.org';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
      // Always show success to avoid email enumeration
      setSubmitted(true);
    } catch {
      toast.error('Could not reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Forgot Password</CardTitle>
          <CardDescription>
            Enter your account email and we'll send you a reset link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                If an account exists for <strong>{email}</strong>, a password reset link has been
                sent. Check your inbox.
              </p>
              <Link to="/" className="text-sm text-primary underline underline-offset-4">
                Back to home
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
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
              <p className="text-center text-sm text-muted-foreground">
                Remembered it?{' '}
                <Link to="/" className="text-primary underline underline-offset-4">
                  Back to home
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
