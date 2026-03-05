/**
 * @file ConfirmEmail.tsx
 * @description Email change confirmation landing page. Route: /confirm-email
 *
 * After a club admin requests an email change via ChangePassword.tsx, the
 * new address receives a password-reset link (the change is applied immediately
 * server-side). This page handles the legacy /confirm-email token path — the
 * server endpoint now returns ok immediately for any token.
 */
import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router';
import { Button } from '../components/ui/button';
import { RefreshCw } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://api.uomcc.org';

export function ConfirmEmail() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [newEmail, setNewEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setErrorMsg('Missing confirmation token.');
      setStatus('error');
      return;
    }
    fetch(`${API_BASE}/auth/confirm-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Confirmation failed');
        setNewEmail(data.email ?? '');
        setStatus('success');
      })
      .catch((err: Error) => {
        setErrorMsg(err.message);
        setStatus('error');
      });
  }, [token]);

  if (status === 'loading') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 text-muted-foreground">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <p className="text-sm">Confirming your email…</p>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <img
        src="/assets/Sitting.png"
        alt="Sitting"
        className="h-36 w-36 object-contain mb-4"
      />

      {status === 'success' ? (
        <div className="max-w-sm space-y-4">
          <h2 className="text-xl">Email updated</h2>
          <p className="text-sm text-muted-foreground">
            Your login email{newEmail ? (
              <> is now <strong>{newEmail}</strong></>
            ) : ' has been updated'}.
          </p>
          <p className="text-sm text-muted-foreground">
            A password reset link was sent to your new address so you can set a
            fresh password for the updated account.
          </p>
          <Button asChild className="bg-primary w-full">
            <Link to="/">Back to home</Link>
          </Button>
        </div>
      ) : (
        <div className="max-w-sm space-y-4">
          <h2 className="text-xl">Confirmation failed</h2>
          <p className="text-sm text-muted-foreground">{errorMsg}</p>
          <p className="text-sm text-muted-foreground">
            The link may have expired or already been used. Request a new one
            from the Change Password page.
          </p>
          <Button asChild className="bg-primary w-full">
            <Link to="/change-password">Change Password</Link>
          </Button>
          <div>
            <Link to="/" className="text-sm text-muted-foreground underline underline-offset-4">
              Back to home
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
