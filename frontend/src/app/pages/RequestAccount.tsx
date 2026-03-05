/**
 * @file RequestAccount.tsx
 * @description Public form for organizations to request a club admin account. Route: /request-account
 *
 * Submits POST /auth/request-account { clubName, contactEmail, message? }.
 * This only creates a pending row — no email is sent immediately.
 * The MCC root admin reviews requests in ClubManagement and approves them,
 * at which point login credentials are emailed to the contact address.
 */
import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://api.uomcc.org';
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
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">

      <img
        src="/assets/Sitting.png"
        alt="Sitting and waiting"
        className="h-36 w-36 object-contain mb-2"
      />

      {submitted ? (
        <div className="max-w-sm space-y-4">
          <h2 className="text-xl">Request submitted</h2>
          <p className="text-sm text-muted-foreground">
            Your request for <strong>{clubName}</strong> is now pending review
            by the MCC administrator.
          </p>
          <p className="text-sm text-muted-foreground">
            No email has been sent yet — you'll receive your login credentials
            at <strong>{contactEmail}</strong> once your request is approved.
            This typically takes a few business days.
          </p>
          <div className="pt-2">
            <Link to="/" className="text-sm text-muted-foreground underline underline-offset-4">
              Back to home
            </Link>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-sm space-y-5">
          <div>
            <h2 className="text-xl mb-1">Request an account</h2>
            <p className="text-sm text-muted-foreground">
              Fill in the form below. The MCC administrator will review your
              request and email your login credentials to the address you provide.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
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
              <p className="text-xs text-muted-foreground mt-1">
                Your credentials will be sent here once approved.
              </p>
            </div>
            <div>
              <Label htmlFor="message">Message <span className="font-normal text-muted-foreground">(optional)</span></Label>
              <Textarea
                id="message"
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Anything you'd like the administrator to know…"
                rows={3}
              />
            </div>
            <Button type="submit" className="w-full bg-primary" disabled={loading}>
              {loading ? 'Submitting…' : 'Submit Request'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/" className="text-primary underline underline-offset-4">
              Back to home
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
