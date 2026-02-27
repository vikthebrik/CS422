import { useState, useCallback, useEffect } from 'react';
import { Trash2, Plus, RefreshCw, Building2, ImageIcon, CheckCircle, XCircle, Users, Copy, Check, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
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
import { format } from 'date-fns';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

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
  password: string;
}

export function ClubManagement() {
  const { clubs, events, authToken, addClub, updateClub, deleteEvent } = useApp();
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
  const [copiedField, setCopiedField] = useState<'email' | 'password' | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [rejectConfirm, setRejectConfirm] = useState<AccountRequest | null>(null);

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
      setApprovalResult({ clubName: data.clubName, email: data.email, password: data.password });
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

  const copyToClipboard = async (text: string, field: 'email' | 'password') => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const historyRequests = requests.filter(r => r.status !== 'pending');

  const unions = clubs.filter(c => c.orgType === 'union');
  const departments = clubs.filter(c => c.orgType === 'department');

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
          <p className="font-medium text-sm truncate">{club.name}</p>
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
      <div>
        <h2 className="text-2xl mb-1">Organization Management</h2>
        <p className="text-muted-foreground">Add or remove organizations from the platform</p>
      </div>

      {/* Join Requests */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <CardTitle>Join Requests</CardTitle>
            {pendingRequests.length > 0 && (
              <Badge className="bg-orange-500 text-white">{pendingRequests.length} pending</Badge>
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
                      className="bg-green-600 hover:bg-green-700 text-white"
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

      {/* Approval credentials dialog */}
      <Dialog open={!!approvalResult} onOpenChange={open => { if (!open) setApprovalResult(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Account Created — {approvalResult?.clubName}</DialogTitle>
          </DialogHeader>
          {approvalResult && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Share these credentials with the club. They can change their password after logging in.
              </p>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 text-sm bg-muted px-3 py-2 rounded-md font-mono">
                      {approvalResult.email}
                    </code>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => copyToClipboard(approvalResult.email, 'email')}
                    >
                      {copiedField === 'email' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Password</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="flex-1 text-sm bg-muted px-3 py-2 rounded-md font-mono">
                      {approvalResult.password}
                    </code>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => copyToClipboard(approvalResult.password, 'password')}
                    >
                      {copiedField === 'password' ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
              <Button className="w-full" onClick={() => setApprovalResult(null)}>Done</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
