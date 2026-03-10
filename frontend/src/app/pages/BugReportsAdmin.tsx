/**
 * @file BugReportsAdmin.tsx
 * @description Root-admin-only bug reports triage page. Route: /bug-reports
 *
 * Displays all submitted bug reports in a filterable data table.
 * Clicking a row opens a detail panel to update status and add admin notes.
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { RefreshCw, Bug, Lightbulb, MessageSquare, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://api.uomcc.org';

type ReportStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
type ReportType = 'bug' | 'feature_request' | 'feedback';

interface BugReport {
  id: string;
  reporter_email: string | null;
  reporter_id: string | null;
  type: ReportType;
  status: ReportStatus;
  title: string;
  description: string;
  url: string | null;
  user_agent: string | null;
  screen_resolution: string | null;
  created_at: string;
  resolved_at: string | null;
  admin_notes: string | null;
}

const STATUS_COLORS: Record<ReportStatus, string> = {
  open: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  resolved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  closed: 'bg-muted text-muted-foreground',
};

const TYPE_ICON: Record<ReportType, React.ReactNode> = {
  bug: <Bug className="h-3.5 w-3.5" />,
  feature_request: <Lightbulb className="h-3.5 w-3.5" />,
  feedback: <MessageSquare className="h-3.5 w-3.5" />,
};

const TYPE_LABEL: Record<ReportType, string> = {
  bug: 'Bug',
  feature_request: 'Feature Request',
  feedback: 'Feedback',
};

const STATUS_LABEL: Record<ReportStatus, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

export function BugReportsAdmin() {
  const { authToken } = useApp();
  const [reports, setReports] = useState<BugReport[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<BugReport | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState<ReportStatus>('open');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const pageSize = 25;
  const totalPages = Math.ceil(total / pageSize);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await fetch(`${API_BASE}/admin/bug-reports?${params}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) throw new Error('Failed to fetch reports');
      const data = await res.json();
      setReports(data.reports ?? []);
      setTotal(data.total ?? 0);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [authToken, page, statusFilter]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  function openDetail(report: BugReport) {
    setSelected(report);
    setEditNotes(report.admin_notes ?? '');
    setEditStatus(report.status);
  }

  async function handleDelete() {
    if (!selected) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/admin/bug-reports/${selected.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) throw new Error('Failed to delete report');
      setReports(prev => prev.filter(r => r.id !== selected.id));
      setTotal(t => t - 1);
      setSelected(null);
      toast.success('Report deleted');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  }

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/admin/bug-reports/${selected.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ status: editStatus, admin_notes: editNotes }),
      });
      if (!res.ok) throw new Error('Failed to update report');
      const updated = await res.json();
      setReports(prev => prev.map(r => r.id === updated.id ? updated : r));
      setSelected(updated);
      toast.success('Report updated');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Issues &amp; Feedback</h1>
          <p className="text-muted-foreground text-sm mt-1">{total} report{total !== 1 ? 's' : ''} total</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchReports} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Loading…</div>
          ) : reports.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No reports found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left">
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Title</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Reporter</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b last:border-0 hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => openDetail(r)}
                    >
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          {TYPE_ICON[r.type]}
                          {TYPE_LABEL[r.type]}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-xs truncate font-medium">{r.title}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.status]}`}>
                          {STATUS_LABEL[r.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground truncate max-w-[160px]">
                        {r.reporter_email ?? <span className="italic">anonymous</span>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {format(new Date(r.created_at), 'MMM d, yyyy')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="icon" onClick={() => setPage(p => p - 1)} disabled={page === 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="icon" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selected && TYPE_ICON[selected.type]}
              {selected?.title}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{TYPE_LABEL[selected.type]}</Badge>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[selected.status]}`}>
                  {STATUS_LABEL[selected.status]}
                </span>
                <span className="text-muted-foreground">{format(new Date(selected.created_at), 'PPP p')}</span>
              </div>

              <div>
                <p className="font-medium mb-1">Description</p>
                <p className="text-muted-foreground whitespace-pre-wrap bg-muted/30 rounded p-3">{selected.description}</p>
              </div>

              {selected.reporter_email && (
                <p><span className="font-medium">Reporter: </span>{selected.reporter_email}</p>
              )}

              <div className="grid grid-cols-2 gap-2 text-muted-foreground text-xs">
                {selected.url && <p className="col-span-2 truncate"><span className="font-medium text-foreground">Page:</span> {selected.url}</p>}
                {selected.screen_resolution && <p><span className="font-medium text-foreground">Screen:</span> {selected.screen_resolution}</p>}
                {selected.user_agent && <p className="col-span-2 truncate"><span className="font-medium text-foreground">Browser:</span> {selected.user_agent}</p>}
              </div>

              <hr className="border-border" />

              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={editStatus} onValueChange={(v) => setEditStatus(v as ReportStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Admin Notes</Label>
                <Textarea
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  placeholder="e.g. Fix deployed in v1.2, Unable to reproduce…"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <Button
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  {deleting ? 'Deleting…' : 'Delete'}
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving…' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
