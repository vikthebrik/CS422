import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Trash2, Plus, RefreshCw, Building2, ImageIcon, CheckCircle, XCircle, Users, ChevronDown, ChevronUp, AlertTriangle, Calendar, Pencil, X, Mail } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';
import { Club } from '../types';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { LogoUpload } from '../components/LogoUpload';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { format } from 'date-fns';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://api.uomcc.org';

interface AccountRequest {
  id: string;
  club_name: string;
  contact_email: string;
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

interface ApprovalResult {
  clubName: string;
  email: string;
  fromEmail?: string;
}

interface EventType { id: string; name: string; }

const EVENT_TYPES_FALLBACK = ['Events', 'Meetings', 'Office Hours', 'Other'];

export function ClubManagement() {
  const { clubs, events, authToken, addClub, updateClub, deleteEvent, addEvent } = useApp();
  const navigate = useNavigate();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Club | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [logoDialogClub, setLogoDialogClub] = useState<Club | null>(null);

  // Add club form state
  const [newName, setNewName] = useState('');
  const [newOrgType, setNewOrgType] = useState<'union' | 'department'>('union');
  const [newDescription, setNewDescription] = useState('');

  // Requests state
  const [requests, setRequests] = useState<AccountRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [requestOrgTypes, setRequestOrgTypes] = useState<Record<string, 'union' | 'department'>>({});
  const [approvalResult, setApprovalResult] = useState<ApprovalResult | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [rejectConfirm, setRejectConfirm] = useState<AccountRequest | null>(null);
  const [clearAllConfirm, setClearAllConfirm] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);

  // Create Event state
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [createEventType, setCreateEventType] = useState('');
  const [createClubId, setCreateClubId] = useState('');
  const [createRequiresRsvp, setCreateRequiresRsvp] = useState(false);
  const [createRsvpLink, setCreateRsvpLink] = useState('');
  const [createRsvpNote, setCreateRsvpNote] = useState('');
  const [defaultStart, setDefaultStart] = useState('');
  const [defaultEnd, setDefaultEnd] = useState('');
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [newTypeName, setNewTypeName] = useState('');
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [editingTypeName, setEditingTypeName] = useState('');
  const [deleteTypeConfirm, setDeleteTypeConfirm] = useState<EventType | null>(null);

  // Email change
  const [emailDialogClub, setEmailDialogClub] = useState<Club | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);

  const apiCall = useCallback(
    (method: string, path: string, body?: object) =>
      fetch(`${API_BASE}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      }),
    [authToken]
  );

  useEffect(() => {
    fetch(`${API_BASE}/event-types`)
      .then(r => r.json())
      .then(setEventTypes)
      .catch(() => {});
  }, []);


  const handleAddType = async () => {
    if (!newTypeName.trim()) return;
    try {
      const res = await apiCall('POST', '/event-types', { name: newTypeName.trim() });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Failed to create type'); return; }
      setEventTypes(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewTypeName('');
    } catch { toast.error('Could not reach the server'); }
  };

  const handleRenameType = async (id: string) => {
    if (!editingTypeName.trim()) return;
    try {
      const res = await apiCall('PATCH', `/event-types/${id}`, { name: editingTypeName.trim() });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Failed to rename type'); return; }
      setEventTypes(prev => prev.map(t => t.id === id ? data : t).sort((a, b) => a.name.localeCompare(b.name)));
      setEditingTypeId(null);
    } catch { toast.error('Could not reach the server'); }
  };

  const handleDeleteType = async (id: string) => {
    try {
      const res = await apiCall('DELETE', `/event-types/${id}`);
      if (!res.ok) { const d = await res.json(); toast.error(d.error ?? 'Failed'); return; }
      setEventTypes(prev => prev.filter(t => t.id !== id));
      setDeleteTypeConfirm(null);
    } catch { toast.error('Could not reach the server'); }
  };

  const openCreateEvent = () => {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    now.setHours(now.getHours() + 1);
    const end = new Date(now);
    end.setHours(end.getHours() + 1);
    const pad = (n: number) => String(n).padStart(2, '0');
    const toLocal = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setDefaultStart(toLocal(now));
    setDefaultEnd(toLocal(end));
    setCreateClubId(clubs[0]?.id ?? '');
    setCreateEventType('');
    setCreateRequiresRsvp(false);
    setCreateRsvpLink('');
    setCreateRsvpNote('');
    setIsCreateEventOpen(true);
  };

  const handleCreateEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const startVal = formData.get('startTime') as string;
    const endVal = formData.get('endTime') as string;
    const rsvpLinkVal = createRsvpLink || null;
    if (!createClubId) { return; }

    try {
      const res = await apiCall('POST', '/events', {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        location: formData.get('location') as string,
        eventType: createEventType || undefined,
        clubId: createClubId,
        startTime: new Date(startVal).toISOString(),
        endTime: new Date(endVal).toISOString(),
        rsvpLink: rsvpLinkVal,
        requiresRsvp: createRequiresRsvp,
        rsvpNote: createRsvpNote || null,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error((data as any).error ?? `Server error (${res.status})`); return; }

      const clubColor = clubs.find(c => c.id === data.club_id)?.color;
      addEvent({
        id: data.id,
        title: data.title,
        description: data.description ?? '',
        location: data.location ?? '',
        startTime: new Date(data.start_time),
        endTime: new Date(data.end_time),
        clubId: data.club_id,
        eventType: data.type ?? 'Other',
        color: clubColor,
        requiresRsvp: data.requires_rsvp ?? createRequiresRsvp,
        rsvpLink: data.rsvp_link ?? null,
        rsvpNote: data.rsvp_note ?? null,
      });
      toast.success('Event created');
      setIsCreateEventOpen(false);
    } catch {
      toast.error('Could not reach the server');
    }
  };

  useEffect(() => {
    apiCall('GET', '/admin/requests')
      .then(res => (res.ok ? res.json() : Promise.reject()))
      .then((data: AccountRequest[]) => setRequests(data))
      .catch(() => toast.error('Could not load join requests'))
      .finally(() => setLoadingRequests(false));
  }, []);

  const handleDeleteConfirmed = async (club: Club) => {
    setDeleteConfirm(null);
    setDeletingId(club.id);
    try {
      const res = await apiCall('DELETE', `/clubs/${club.id}`);
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error ?? 'Failed to delete club');
        return;
      }
      events.filter(e => e.clubId === club.id).forEach(e => deleteEvent(e.id));
      window.location.reload();
    } catch {
      toast.error('Could not reach the server');
    } finally {
      setDeletingId(null);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) { toast.error('Name is required'); return; }
    setIsAdding(true);
    try {
      const res = await apiCall('POST', '/clubs', {
        name: newName.trim(),
        orgType: newOrgType,
        description: newDescription.trim() || undefined,
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Failed to create club'); return; }

      addClub({
        id: data.id,
        name: data.name,
        orgType: data.org_type ?? newOrgType,
        color: '#94a3b8',
        description: newDescription.trim() || undefined,
      });

      toast.success(`"${data.name}" added successfully`);
      setNewName('');
      setNewOrgType('union');
      setNewDescription('');
    } catch {
      toast.error('Could not reach the server');
    } finally {
      setIsAdding(false);
    }
  };

  const handleApprove = async (request: AccountRequest) => {
    const orgType = requestOrgTypes[request.id] ?? 'union';
    setApprovingId(request.id);
    try {
      const res = await apiCall('POST', `/admin/requests/${request.id}/approve`, { orgType });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Approval failed'); return; }
      setRequests(prev => prev.map(r => r.id === request.id ? { ...r, status: 'approved' } : r));
      setApprovalResult({ clubName: data.clubName, email: data.email, fromEmail: data.fromEmail });
      toast.success(`"${data.clubName}" approved and account created`);
    } catch {
      toast.error('Could not reach the server');
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (request: AccountRequest) => {
    setRejectConfirm(null);
    setRejectingId(request.id);
    try {
      const res = await apiCall('POST', `/admin/requests/${request.id}/reject`);
      if (!res.ok) { const err = await res.json(); toast.error(err.error ?? 'Failed to reject'); return; }
      setRequests(prev => prev.map(r => r.id === request.id ? { ...r, status: 'rejected' } : r));
      toast.success(`Request from "${request.club_name}" rejected`);
    } catch {
      toast.error('Could not reach the server');
    } finally {
      setRejectingId(null);
    }
  };

  const handleClearAllRequests = async () => {
    setClearAllConfirm(false);
    setClearingAll(true);
    try {
      const res = await apiCall('DELETE', '/admin/requests');
      if (!res.ok) { const err = await res.json(); toast.error(err.error ?? 'Failed to clear requests'); return; }
      setRequests(prev => prev.filter(r => r.status === 'pending'));
      toast.success('Request history cleared — previous applicants can now reapply');
    } catch {
      toast.error('Could not reach the server');
    } finally {
      setClearingAll(false);
    }
  };


  const pendingRequests = requests.filter(r => r.status === 'pending');
  const historyRequests = requests.filter(r => r.status !== 'pending');

  const unions = clubs.filter(c => c.orgType === 'union');
  const departments = clubs.filter(c => c.orgType === 'department');

  const handleChangeEmail = async () => {
    if (!emailDialogClub || !emailInput.trim()) return;
    setSavingEmail(true);
    try {
      const res = await apiCall('PATCH', `/admin/clubs/${emailDialogClub.id}/email`, { newEmail: emailInput.trim() });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Failed to update email'); return; }
      updateClub(emailDialogClub.id, { adminEmail: data.email });
      toast.success(`Email updated to ${data.email}`);
      setEmailDialogClub(null);
      setEmailInput('');
    } catch {
      toast.error('Could not reach the server');
    } finally {
      setSavingEmail(false);
    }
  };

  const renderClubRow = (club: Club) => {
    const eventCount = events.filter(e => e.clubId === club.id).length;
    const isDeleting = deletingId === club.id;
    return (
      <div key={club.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/30 transition-colors">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0 text-sm font-medium overflow-hidden"
          style={{ backgroundColor: club.color }}
        >
          {club.logo ? (
            <ImageWithFallback src={club.logo} alt={club.name} className="w-full h-full object-cover" />
          ) : (
            club.name.substring(0, 2)
          )}
        </div>
        <div className="flex-1 min-w-0">
          <button
            type="button"
            className="font-medium text-sm truncate text-left hover:text-primary hover:underline underline-offset-4 transition-colors block w-full"
            onClick={() => navigate(`/club/${club.id}`)}
          >
            {club.name}
          </button>
          <p className="text-xs text-muted-foreground">{eventCount} event{eventCount !== 1 ? 's' : ''}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={() => setLogoDialogClub(club)}
          title={`Upload logo for ${club.name}`}
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={() => { setEmailInput(club.adminEmail ?? ''); setEmailDialogClub(club); }}
          title={`Change email for ${club.name}`}
        >
          <Mail className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
          onClick={() => setDeleteConfirm(club)}
          disabled={isDeleting}
          title={`Delete ${club.name}`}
        >
          {isDeleting
            ? <RefreshCw className="h-4 w-4 animate-spin" />
            : <Trash2 className="h-4 w-4" />}
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl mb-1">Organization Management</h2>
          <p className="text-muted-foreground">Add or remove organizations from the platform</p>
        </div>
        <Button onClick={openCreateEvent} disabled={clubs.length === 0}>
          <Plus className="h-4 w-4 mr-2" />
          Add Event
        </Button>
      </div>

      {/* Join Requests */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <CardTitle>Join Requests</CardTitle>
              {pendingRequests.length > 0 && (
                <Badge className="bg-orange-500 text-white">{pendingRequests.length} pending</Badge>
              )}
            </div>
            {historyRequests.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setClearAllConfirm(true)}
                disabled={clearingAll}
              >
                {clearingAll
                  ? <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />Clearing…</>
                  : <><Trash2 className="h-3.5 w-3.5 mr-1.5" />Clear History</>}
              </Button>
            )}
          </div>
          <CardDescription>Organizations requesting to join the platform</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingRequests ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading requests…
            </div>
          ) : pendingRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No pending requests</p>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map(req => (
                <div key={req.id} className="border border-border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{req.club_name}</p>
                      <p className="text-sm text-muted-foreground">{req.contact_email}</p>
                      {req.message && (
                        <p className="text-sm mt-1 text-foreground/80">{req.message}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(req.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Select
                      value={requestOrgTypes[req.id] ?? 'union'}
                      onValueChange={(v: 'union' | 'department') =>
                        setRequestOrgTypes(prev => ({ ...prev, [req.id]: v }))
                      }
                    >
                      <SelectTrigger className="h-8 w-36 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="union">Union</SelectItem>
                        <SelectItem value="department">Department</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      className=""
                      onClick={() => handleApprove(req)}
                      disabled={approvingId === req.id || rejectingId === req.id}
                    >
                      {approvingId === req.id
                        ? <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />Approving…</>
                        : <><CheckCircle className="h-3.5 w-3.5 mr-1.5" />Approve</>}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setRejectConfirm(req)}
                      disabled={approvingId === req.id || rejectingId === req.id}
                    >
                      {rejectingId === req.id
                        ? <><RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />Rejecting…</>
                        : <><XCircle className="h-3.5 w-3.5 mr-1.5" />Reject</>}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* History toggle */}
          {historyRequests.length > 0 && (
            <div className="mt-4 border-t pt-3">
              <button
                type="button"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowHistory(v => !v)}
              >
                {showHistory ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                {showHistory ? 'Hide history' : `Show history (${historyRequests.length})`}
              </button>
              {showHistory && (
                <div className="mt-3 space-y-2">
                  {historyRequests.map(req => (
                    <div key={req.id} className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/40 text-sm">
                      <div>
                        <span className="font-medium">{req.club_name}</span>
                        <span className="text-muted-foreground ml-2">{req.contact_email}</span>
                      </div>
                      <Badge variant={req.status === 'approved' ? 'default' : 'secondary'}>
                        {req.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Organization */}
      <Card>
        <CardHeader>
          <CardTitle>Add Organization</CardTitle>
          <CardDescription>Create a new union or department entry</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="new-name">Organization Name *</Label>
                <Input
                  id="new-name"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Black Student Union"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="new-org-type">Type</Label>
                <Select value={newOrgType} onValueChange={(v: 'union' | 'department') => setNewOrgType(v)}>
                  <SelectTrigger id="new-org-type" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="union">Union</SelectItem>
                    <SelectItem value="department">Department</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="new-desc">Description (optional)</Label>
              <Input
                id="new-desc"
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                placeholder="Brief description of the organization"
                className="mt-1"
              />
            </div>
            <Button type="submit" className="bg-primary" disabled={isAdding || !newName.trim()}>
              {isAdding ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              {isAdding ? 'Adding…' : 'Add Organization'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Unions list */}
      {unions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Unions</CardTitle>
              <Badge variant="secondary">{unions.length}</Badge>
            </div>
            <CardDescription>Student unions — click the trash icon to permanently remove</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {unions.map(renderClubRow)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Departments list */}
      {departments.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Departments</CardTitle>
              <Badge variant="secondary">{departments.length}</Badge>
            </div>
            <CardDescription>MCC departments — click the trash icon to permanently remove</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {departments.map(renderClubRow)}
            </div>
          </CardContent>
        </Card>
      )}

      {clubs.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p>No clubs yet. Add one above.</p>
        </div>
      )}

      {/* Event Types Management */}
      <Card>
        <CardHeader>
          <CardTitle>Event Types</CardTitle>
          <CardDescription>Add, rename, or remove event type categories</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {eventTypes.map(et => (
            <div key={et.id} className="flex items-center gap-2">
              {editingTypeId === et.id ? (
                <>
                  <input
                    className="flex-1 border border-border rounded px-2 py-1 text-sm"
                    value={editingTypeName}
                    onChange={e => setEditingTypeName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleRenameType(et.id); }}
                    autoFocus
                  />
                  <Button size="sm" onClick={() => handleRenameType(et.id)}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingTypeId(null)}>
                    <X className="h-3 w-3" />
                  </Button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm">{et.name}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setEditingTypeId(et.id); setEditingTypeName(et.name); }}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeleteTypeConfirm(et)}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </>
              )}
            </div>
          ))}
          <div className="flex items-center gap-2 pt-2 border-t">
            <input
              className="flex-1 border border-border rounded px-2 py-1 text-sm"
              placeholder="New event type name…"
              value={newTypeName}
              onChange={e => setNewTypeName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddType(); }}
            />
            <Button size="sm" onClick={handleAddType} disabled={!newTypeName.trim()}>
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      {deleteConfirm && (() => {
        const eventCount = events.filter(e => e.clubId === deleteConfirm.id).length;
        return (
          <Dialog open onOpenChange={open => { if (!open) setDeleteConfirm(null); }}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <div className="flex items-center gap-3 mb-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  </div>
                  <DialogTitle>Delete "{deleteConfirm.name}"?</DialogTitle>
                </div>
                <DialogDescription>
                  {eventCount > 0
                    ? `This will permanently delete the organization and its ${eventCount} event${eventCount !== 1 ? 's' : ''}. This action cannot be undone.`
                    : 'This will permanently delete the organization. This action cannot be undone.'}
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteConfirmed(deleteConfirm)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        );
      })()}

      {/* Logo upload dialog */}
      <Dialog open={!!logoDialogClub} onOpenChange={open => { if (!open) setLogoDialogClub(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Update Logo — {logoDialogClub?.name}</DialogTitle>
          </DialogHeader>
          {logoDialogClub && (
            <LogoUpload
              clubId={logoDialogClub.id}
              currentLogo={logoDialogClub.logo}
              clubColor={logoDialogClub.color}
              clubInitials={logoDialogClub.name.substring(0, 2)}
              authToken={authToken}
              onUploaded={newUrl => {
                updateClub(logoDialogClub.id, { logo: newUrl });
                setLogoDialogClub(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Reject request confirmation dialog */}
      {rejectConfirm && (
        <Dialog open onOpenChange={open => { if (!open) setRejectConfirm(null); }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                  <XCircle className="h-5 w-5 text-destructive" />
                </div>
                <DialogTitle>Reject request?</DialogTitle>
              </div>
              <DialogDescription>
                Reject the join request from <span className="font-medium text-foreground">{rejectConfirm.club_name}</span>? This will mark it as rejected.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setRejectConfirm(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => handleReject(rejectConfirm)}>
                <XCircle className="h-4 w-4 mr-2" />Reject
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Clear all requests confirmation dialog */}
      {clearAllConfirm && (
        <Dialog open onOpenChange={open => { if (!open) setClearAllConfirm(false); }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                  <Trash2 className="h-5 w-5 text-destructive" />
                </div>
                <DialogTitle>Clear all requests?</DialogTitle>
              </div>
              <DialogDescription>
                This will permanently delete all {historyRequests.length} processed request{historyRequests.length !== 1 ? 's' : ''} (approved and rejected) from the database. Pending requests will not be affected. Previously rejected applicants will be able to reapply. This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setClearAllConfirm(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleClearAllRequests}>
                <Trash2 className="h-4 w-4 mr-2" />Clear All
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Approval credentials dialog */}
      <Dialog open={!!approvalResult} onOpenChange={open => { if (!open) setApprovalResult(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Account Created — {approvalResult?.clubName}</DialogTitle>
          </DialogHeader>
          {approvalResult && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                A password-setup email has been sent to <strong>{approvalResult.email}</strong>.
                The link expires in 24 hours — if unused, they can request a new one via
                <strong> Forgot Password</strong> on the login page.
              </p>
              {approvalResult.fromEmail && (
                <p className="text-xs text-muted-foreground">
                  Email sent from: <strong>{approvalResult.fromEmail}</strong>
                </p>
              )}
              <Button className="w-full" onClick={() => setApprovalResult(null)}>Done</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Event Dialog */}
      <Dialog open={isCreateEventOpen} onOpenChange={setIsCreateEventOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Event</DialogTitle>
            <DialogDescription>Add a new event to the calendar</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateEvent} className="space-y-4">
            <div>
              <Label htmlFor="ce-title">Event Title</Label>
              <Input id="ce-title" name="title" required className="mt-1" />
            </div>
            <div>
              <Label htmlFor="ce-description">Description</Label>
              <Textarea id="ce-description" name="description" rows={3} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Organization</Label>
                <Select value={createClubId} onValueChange={setCreateClubId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select organization…" />
                  </SelectTrigger>
                  <SelectContent>
                    {clubs.map(club => (
                      <SelectItem key={club.id} value={club.id}>{club.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Event Type</Label>
                <Select value={createEventType} onValueChange={setCreateEventType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select type…" />
                  </SelectTrigger>
                  <SelectContent>
                    {(eventTypes.length > 0 ? eventTypes.map(et => et.name) : EVENT_TYPES_FALLBACK).map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ce-start">Start Date & Time</Label>
                <Input id="ce-start" name="startTime" type="datetime-local" defaultValue={defaultStart} required className="mt-1" />
              </div>
              <div>
                <Label htmlFor="ce-end">End Date & Time</Label>
                <Input id="ce-end" name="endTime" type="datetime-local" defaultValue={defaultEnd} required className="mt-1" />
              </div>
            </div>
            <div>
              <Label htmlFor="ce-location">Location</Label>
              <Input id="ce-location" name="location" required className="mt-1" />
            </div>
            {/* RSVP Section */}
            <div className="space-y-3 rounded-lg border border-border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">RSVP Required</Label>
                  <p className="text-xs text-muted-foreground">Toggle if attendees must RSVP for this event</p>
                </div>
                <Switch checked={createRequiresRsvp} onCheckedChange={setCreateRequiresRsvp} />
              </div>
              {createRequiresRsvp && (
                <>
                  <div>
                    <Label htmlFor="ce-rsvpLink">RSVP / Ticket Link</Label>
                    <Input
                      id="ce-rsvpLink"
                      value={createRsvpLink}
                      onChange={e => setCreateRsvpLink(e.target.value)}
                      placeholder="https://..."
                      className="mt-1"
                    />
                    {!createRsvpLink && (
                      <div className="flex items-center gap-1.5 mt-1.5 text-amber-600 dark:text-amber-400 text-xs">
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        <span>Add an RSVP link so attendees can register</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="ce-rsvpNote">RSVP Note</Label>
                    <Textarea
                      id="ce-rsvpNote"
                      value={createRsvpNote}
                      onChange={e => setCreateRsvpNote(e.target.value)}
                      placeholder="e.g. Please RSVP by Friday noon. Limited seating available."
                      rows={2}
                      className="mt-1"
                    />
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateEventOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary" disabled={!createClubId}>
                <Calendar className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Email change dialog */}
      <Dialog open={!!emailDialogClub} onOpenChange={open => { if (!open) { setEmailDialogClub(null); setEmailInput(''); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Change Login Email — {emailDialogClub?.name}</DialogTitle>
            <DialogDescription>
              The change is immediate. The club admin will need to use the new email to log in.
            </DialogDescription>
          </DialogHeader>
          {emailDialogClub && (
            <div className="space-y-4">
              {emailDialogClub.adminEmail ? (
                <p className="text-xs text-muted-foreground">Current email: <span className="font-mono">{emailDialogClub.adminEmail}</span></p>
              ) : (
                <p className="text-xs text-muted-foreground">No email linked yet — set one below.</p>
              )}
              <div>
                <Label htmlFor="email-input">New Email</Label>
                <Input
                  id="email-input"
                  type="email"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  placeholder="new@email.com"
                  className="mt-1"
                  onKeyDown={e => { if (e.key === 'Enter') handleChangeEmail(); }}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setEmailDialogClub(null); setEmailInput(''); }}>Cancel</Button>
                <Button onClick={handleChangeEmail} disabled={savingEmail || !emailInput.trim()}>
                  {savingEmail ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Saving…</> : 'Update Email'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete event type confirmation */}
      {deleteTypeConfirm && (
        <Dialog open onOpenChange={open => { if (!open) setDeleteTypeConfirm(null); }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                  <Trash2 className="h-5 w-5 text-destructive" />
                </div>
                <DialogTitle>Delete "{deleteTypeConfirm.name}"?</DialogTitle>
              </div>
              <DialogDescription>
                Events using this type will show as "Other". This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDeleteTypeConfirm(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => handleDeleteType(deleteTypeConfirm.id)}>
                <Trash2 className="h-4 w-4 mr-2" />Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
