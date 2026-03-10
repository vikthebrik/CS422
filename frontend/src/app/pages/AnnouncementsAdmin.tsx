/**
 * @file AnnouncementsAdmin.tsx
 * @description Root-admin-only announcement management page. Route: /announcements
 *
 * Create, edit, activate/deactivate, and delete announcements that appear as
 * a site-wide banner for all visitors. Primarily used for the MCC newsletter.
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Plus, Pencil, Trash2, RefreshCw, Info, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://api.uomcc.org';

// datetime-local inputs require "YYYY-MM-DDTHH:mm" in LOCAL time.
// Stored values come back as UTC ISO strings, so we convert.
function toLocalDatetimeInput(utcIso: string): string {
  const d = new Date(utcIso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type AnnouncementType = 'info' | 'success' | 'warning';
type AnnouncementWeight = 'subtle' | 'banner';

interface Announcement {
  id: string;
  title: string;
  body: string | null;
  link_url: string | null;
  link_text: string | null;
  type: AnnouncementType;
  weight: AnnouncementWeight;
  active: boolean;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
}

const WEIGHT_OPTIONS: { value: AnnouncementWeight; label: string; desc: string; preview: string }[] = [
  {
    value: 'subtle',
    label: 'Subtle',
    desc: 'Small inline notice — unobtrusive',
    preview: 'border rounded px-3 py-1.5 text-xs bg-muted/50 border-border',
  },
  {
    value: 'banner',
    label: 'Banner',
    desc: 'Bold full-width bar — hard to miss',
    preview: 'rounded px-3 py-1.5 text-xs bg-amber-500 text-white font-semibold',
  },
];

const WEIGHT_LABEL: Record<AnnouncementWeight, string> = {
  subtle: 'Subtle',
  banner: 'Banner',
};

const TYPE_ICON: Record<AnnouncementType, React.ReactNode> = {
  info:    <Info className="h-4 w-4 text-amber-500" />,
  success: <CheckCircle2 className="h-4 w-4 text-emerald-700" />,
  warning: <AlertTriangle className="h-4 w-4 text-rose-400" />,
};

const EMPTY_FORM = {
  title: '',
  body: '',
  link_url: '',
  link_text: '',
  type: 'info' as AnnouncementType,
  weight: 'subtle' as AnnouncementWeight,
  active: true,
  starts_at: '',
  expires_at: '',
};

export function AnnouncementsAdmin() {
  const { authToken } = useApp();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` };

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/announcements`, { headers });
      if (!res.ok) throw new Error('Failed to fetch');
      setAnnouncements(await res.json());
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(a: Announcement) {
    setEditing(a);
    setForm({
      title: a.title,
      body: a.body ?? '',
      link_url: a.link_url ?? '',
      link_text: a.link_text ?? '',
      type: a.type,
      weight: a.weight,
      active: a.active,
      // Convert stored UTC back to local datetime-local string for the input
      starts_at: a.starts_at ? toLocalDatetimeInput(a.starts_at) : '',
      expires_at: a.expires_at ? toLocalDatetimeInput(a.expires_at) : '',
    });
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        body: form.body.trim() || null,
        link_url: form.link_url.trim() || null,
        link_text: form.link_text.trim() || null,
        type: form.type,
        weight: form.weight,
        active: form.active,
        // datetime-local gives "2026-03-15T10:00" with no timezone.
        // new Date() parses that as local time; .toISOString() converts to UTC.
        starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      };
      const url = editing
        ? `${API_BASE}/admin/announcements/${editing.id}`
        : `${API_BASE}/admin/announcements`;
      const res = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Save failed');
      const saved: Announcement = await res.json();
      setAnnouncements(prev =>
        editing
          ? prev.map(a => a.id === saved.id ? saved : a)
          : [saved, ...prev]
      );
      toast.success(editing ? 'Announcement updated' : 'Announcement created');
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(a: Announcement) {
    try {
      const res = await fetch(`${API_BASE}/admin/announcements/${a.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ active: !a.active }),
      });
      if (!res.ok) throw new Error('Update failed');
      const updated: Announcement = await res.json();
      setAnnouncements(prev => prev.map(x => x.id === updated.id ? updated : x));
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`${API_BASE}/admin/announcements/${id}`, { method: 'DELETE', headers });
      if (!res.ok) throw new Error('Delete failed');
      setAnnouncements(prev => prev.filter(a => a.id !== id));
      toast.success('Announcement deleted');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  const now = new Date();

  function getStatus(a: Announcement): { label: string; color: string } {
    if (!a.active) return { label: 'Inactive', color: 'bg-muted text-muted-foreground' };
    if (a.expires_at && new Date(a.expires_at) < now) return { label: 'Expired', color: 'bg-muted text-muted-foreground' };
    if (a.starts_at && new Date(a.starts_at) > now) return { label: 'Scheduled', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' };
    return { label: 'Live', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' };
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Announcements</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Broadcast banners shown to all visitors — newsletters, alerts, updates.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchAnnouncements} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1.5" />
            New Announcement
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Loading…</div>
      ) : announcements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            No announcements yet. Create one to broadcast a banner to all visitors.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {announcements.map(a => {
            const status = getStatus(a);
            return (
              <Card key={a.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5">{TYPE_ICON[a.type]}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-medium">{a.title}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                          {WEIGHT_LABEL[a.weight]}
                        </span>
                      </div>
                      {a.body && <p className="text-sm text-muted-foreground">{a.body}</p>}
                      {a.link_url && (
                        <a
                          href={a.link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                        >
                          {a.link_text ?? a.link_url}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1.5 text-xs text-muted-foreground">
                        <span>Created {format(new Date(a.created_at), 'MMM d, yyyy')}</span>
                        {a.starts_at && <span>Starts {format(new Date(a.starts_at), 'MMM d, yyyy h:mm a')}</span>}
                        {a.expires_at && <span>Expires {format(new Date(a.expires_at), 'MMM d, yyyy h:mm a')}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Switch
                        checked={a.active}
                        onCheckedChange={() => toggleActive(a)}
                        title={a.active ? 'Deactivate' : 'Activate'}
                      />
                      <Button variant="ghost" size="icon" onClick={() => openEdit(a)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(a.id)}
                        disabled={deletingId === a.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Announcement' : 'New Announcement'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="space-y-1.5">
              <Label>Weight</Label>
              <div className="grid grid-cols-3 gap-2">
                {WEIGHT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, weight: opt.value }))}
                    className={`flex flex-col gap-2 rounded-lg border-2 p-3 text-left transition-colors ${
                      form.weight === opt.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-muted-foreground/50'
                    }`}
                  >
                    <span className={opt.preview}>{opt.label}</span>
                    <div>
                      <p className="text-xs font-semibold">{opt.label}</p>
                      <p className="text-xs text-muted-foreground leading-snug mt-0.5">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as AnnouncementType }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info (amber)</SelectItem>
                  <SelectItem value="success">Success (dark green)</SelectItem>
                  <SelectItem value="warning">Warning (pastel red)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input
                placeholder="e.g. March 2026 Newsletter is out!"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Body <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Textarea
                placeholder="Short supporting text shown beside the title…"
                value={form.body}
                onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Link URL <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input
                  type="url"
                  placeholder="https://…"
                  value={form.link_url}
                  onChange={e => setForm(f => ({ ...f, link_url: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Link Text</Label>
                <Input
                  placeholder="Read more"
                  value={form.link_text}
                  onChange={e => setForm(f => ({ ...f, link_text: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Starts at <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input
                  type="datetime-local"
                  value={form.starts_at}
                  onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Expires at <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input
                  type="datetime-local"
                  value={form.expires_at}
                  onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="ann-active"
                checked={form.active}
                onCheckedChange={v => setForm(f => ({ ...f, active: v }))}
              />
              <Label htmlFor="ann-active" className="cursor-pointer">Active (visible to users)</Label>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
