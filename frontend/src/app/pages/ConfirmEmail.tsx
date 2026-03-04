import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';

const API_BASE = '/api';

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

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          {status === 'loading' && (
            <>
              <div className="flex justify-center mb-2">
                <RefreshCw className="h-10 w-10 animate-spin text-muted-foreground" />
              </div>
              <CardTitle>Confirming your email…</CardTitle>
            </>
          )}
          {status === 'success' && (
            <>
              <div className="flex justify-center mb-2">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
              <CardTitle>Email updated!</CardTitle>
              <CardDescription>Your login email is now <strong>{newEmail}</strong>.</CardDescription>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="flex justify-center mb-2">
                <XCircle className="h-10 w-10 text-destructive" />
              </div>
              <CardTitle>Confirmation failed</CardTitle>
              <CardDescription>{errorMsg}</CardDescription>
            </>
          )}
        </CardHeader>
        {status !== 'loading' && (
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/">Back to Home</Link>
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
