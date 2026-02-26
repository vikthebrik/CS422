import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RequestAccount() {
  const [clubName, setClubName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!EMAIL_REGEX.test(contactEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/request-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clubName, contactEmail, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to submit request');
        return;
      }
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
          <CardTitle>Request an Account</CardTitle>
          <CardDescription>
            Fill in the form below to request an admin account for your club. The MCC root
            administrator will review and provision your credentials.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                Your request has been submitted. The MCC administrator will be in touch via{' '}
                <strong>{contactEmail}</strong>.
              </p>
              <Link to="/" className="text-sm text-primary underline underline-offset-4">
                Back to home
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="clubName">Club / Organization Name</Label>
                <Input
                  id="clubName"
                  value={clubName}
                  onChange={e => setClubName(e.target.value)}
                  placeholder="e.g. Black Student Union"
                  required
                />
              </div>
              <div>
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={contactEmail}
                  onChange={e => setContactEmail(e.target.value)}
                  placeholder="you@uoregon.edu"
                  required
                  autoComplete="email"
                />
              </div>
              <div>
                <Label htmlFor="message">Message (optional)</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Anything you'd like to share with the administrator…"
                  rows={3}
                />
              </div>
              <Button type="submit" className="w-full bg-primary" disabled={loading}>
                {loading ? 'Submitting…' : 'Submit Request'}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
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
