import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const { setCurrentUser, setAuthToken } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!EMAIL_REGEX.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? 'Login failed');
        return;
      }

      setCurrentUser(data.user);
      setAuthToken(data.token);
      toast.success(`Logged in as ${data.user.name}`);
      onOpenChange(false);
      setEmail('');
      setPassword('');
    } catch {
      toast.error('Could not reach the server. Is it running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Admin Login</DialogTitle>
          <DialogDescription>
            Sign in to access admin features and manage events
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleLogin} className="space-y-4">
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
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-primary" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
          </div>
        </form>
        <div className="border-t pt-4 flex flex-col gap-1">
          <button
            type="button"
            className="text-xs text-primary underline underline-offset-4 text-left"
            onClick={() => { onOpenChange(false); navigate('/forgot-password'); }}
          >
            Forgot your password?
          </button>
          <button
            type="button"
            className="text-xs text-muted-foreground underline underline-offset-4 text-left"
            onClick={() => { onOpenChange(false); navigate('/request-account'); }}
          >
            Don't have an account? Request one
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
