import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useApp } from '../context/AppContext';
import { CheckCircle2 } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://api.uomcc.org';

interface BugReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BugReportModal({ open, onOpenChange }: BugReportModalProps) {
  const { currentUser, authToken } = useApp();

  const [type, setType] = useState('bug');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const isAuthenticated = !!currentUser;
  const reporterEmail = isAuthenticated ? currentUser.email : email;

  function resetForm() {
    setType('bug');
    setTitle('');
    setDescription('');
    setEmail('');
    setSubmitting(false);
    setSubmitted(false);
    setError('');
  }

  function handleOpenChange(val: boolean) {
    if (!val) {
      setTimeout(resetForm, 300); // wait for close animation
    }
    onOpenChange(val);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('Title and description are required.');
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const res = await fetch(`${API_BASE}/bug-reports`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: isAuthenticated ? undefined : email || undefined,
          type,
          title: title.trim(),
          description: description.trim(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          resolution: `${window.innerWidth}x${window.innerHeight}`,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Submission failed');
      }

      setSubmitted(true);
      setTimeout(() => handleOpenChange(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Report an Issue</DialogTitle>
        </DialogHeader>

        {submitted ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <p className="font-medium text-lg">Thank you!</p>
            <p className="text-muted-foreground text-sm">Our team has received your report.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="br-type">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="br-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bug">Bug</SelectItem>
                  <SelectItem value="feature_request">Feature Request</SelectItem>
                  <SelectItem value="feedback">General Feedback</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="br-title">Title</Label>
              <Input
                id="br-title"
                placeholder="Brief summary"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="br-description">Description</Label>
              <Textarea
                id="br-description"
                placeholder="Detailed explanation or steps to reproduce…"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={4}
                required
              />
            </div>

            {!isAuthenticated && (
              <div className="space-y-1.5">
                <Label htmlFor="br-email">Email <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input
                  id="br-email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            )}

            {isAuthenticated && (
              <p className="text-xs text-muted-foreground">Submitting as {reporterEmail}</p>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Sending…' : 'Submit Report'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
