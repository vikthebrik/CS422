/**
 * @file Collab.tsx
 * @description Collaboration management page for club officers and root admin. Route: /collab
 *
 * ## Views
 * Root admin — tab toggle:
 *   "All Clubs"  : every collab record across all orgs, both clubs shown per row
 *   "By Club"    : select an org → see that org's hosting events + received invites
 *
 * Club admin — two sections on one page:
 *   "Hosting"    : events they own that have accepted collaborators (from events context)
 *   "Invited"    : collab invites received (pending / upcoming / past / declined)
 *
 * ## Auth
 * Protected by `ProtectedRoute` (any authenticated user).
 * Backend scopes GET /collab by club_id for club_admin; returns all for root.
 */
import { useState, useEffect, useCallback } from 'react';
import { Users, Clock, Check, X, Calendar, ExternalLink, RotateCcw, Trash2, Building2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useApp } from '../context/AppContext';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';

interface CollabRecord {
  id: string;
  event_id: string;
  club_id: string;
  role: string;
  status: 'pending' | 'accepted' | 'rejected';
  events: {
    id: string;
    title: string;
    start_time: string;
    end_time: string;
    clubs: { name: string; logo_url: string | null } | null;
  } | null;
}

// ---------------------------------------------------------------------------
// Shared collab card used in both the invited sections
// ---------------------------------------------------------------------------
interface CollabCardProps {
  collab: CollabRecord;
  showInvitedClubName?: string;
  onAccept?: () => void;
  onDecline?: () => void;
  onReaccept?: () => void;
  onDelete?: () => void;
  faded?: boolean;
}

function CollabCard({ collab, showInvitedClubName, onAccept, onDecline, onReaccept, onDelete, faded }: CollabCardProps) {
  const navigate = useNavigate();
  const isNavigable = !!(onAccept === undefined && onDecline === undefined && onReaccept === undefined && onDelete === undefined);

  return (
    <div
      className={`border border-border rounded-lg p-4 ${faded ? 'opacity-60' : ''} ${isNavigable ? 'cursor-pointer hover:bg-muted/40 transition-colors' : ''}`}
      onClick={isNavigable ? () => collab.events?.id && navigate(`/event/${collab.events.id}`) : undefined}
    >
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className={`rounded-lg p-2 mt-1 shrink-0 ${
            onAccept ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
            : faded ? 'bg-muted text-muted-foreground'
            : 'bg-primary/10 text-primary'
          }`}>
            {onAccept ? <Clock className="h-5 w-5" /> : faded ? <Calendar className="h-5 w-5" /> : onReaccept ? <X className="h-5 w-5" /> : <Calendar className="h-5 w-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h4 className="font-medium truncate">{collab.events?.title ?? '—'}</h4>
              {!onAccept && !onReaccept && <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
            </div>
            {collab.events?.start_time && (
              <p className="text-sm text-muted-foreground mb-2">
                {format(new Date(collab.events.start_time), 'EEE, MMM d, yyyy · h:mm a')}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {collab.events?.clubs?.name && (
                <Badge variant="outline" className="text-xs">
                  Hosted by {collab.events.clubs.name}
                </Badge>
              )}
              {showInvitedClubName && (
                <Badge variant="secondary" className="text-xs">
                  {showInvitedClubName}
                </Badge>
              )}
            </div>
          </div>
        </div>
        {(onAccept || onDecline || onReaccept || onDelete) && (
          <div className="flex gap-2 sm:flex-col shrink-0">
            {onAccept && (
              <Button size="sm" className="bg-primary" onClick={e => { e.stopPropagation(); onAccept(); }}>
                <Check className="h-4 w-4 mr-1" />Accept
              </Button>
            )}
            {onDecline && (
              <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); onDecline(); }}>
                <X className="h-4 w-4 mr-1" />Decline
              </Button>
            )}
            {onReaccept && (
              <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); onReaccept(); }}>
                <RotateCcw className="h-4 w-4 mr-1" />Re-accept
              </Button>
            )}
            {onDelete && (
              <Button size="sm" variant="ghost" onClick={e => { e.stopPropagation(); onDelete(); }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// InvitedSection — collab invites received by a club (pending/accepted/declined)
// ---------------------------------------------------------------------------
interface InvitedSectionProps {
  collabs: CollabRecord[];
  onStatusChange: (id: string, status: 'accepted' | 'rejected') => void;
  onDelete: (id: string) => void;
}

function InvitedSection({ collabs, onStatusChange, onDelete }: InvitedSectionProps) {
  const now = new Date();
  const pending = collabs.filter(c => c.status === 'pending');
  const accepted = collabs.filter(c => c.status === 'accepted');
  const upcoming = accepted.filter(c => c.events?.start_time && new Date(c.events.start_time) >= now);
  const past = accepted.filter(c => c.events?.start_time && new Date(c.events.start_time) < now);
  const declined = collabs.filter(c => c.status === 'rejected');

  const handleClearDeclined = async () => {
    await Promise.all(declined.map(c => onDelete(c.id)));
    toast.success('Declined invites cleared');
  };

  return (
    <div className="space-y-4">
      {/* Pending */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Pending Invites</CardTitle>
              <CardDescription>Awaiting your response</CardDescription>
            </div>
            {pending.length > 0 && (
              <Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-0">
                {pending.length}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No pending invites</p>
          ) : (
            <div className="space-y-3">
              {pending.map(c => (
                <CollabCard
                  key={c.id}
                  collab={c}
                  onAccept={() => onStatusChange(c.id, 'accepted')}
                  onDecline={() => onStatusChange(c.id, 'rejected')}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming accepted */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Upcoming</CardTitle>
          <CardDescription>Accepted collaborations coming up</CardDescription>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No upcoming collaborative events</p>
          ) : (
            <div className="space-y-3">
              {upcoming.map(c => (
                <CollabCard
                  key={c.id}
                  collab={c}
                  onDecline={() => onStatusChange(c.id, 'rejected')}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Declined */}
      {declined.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-base">Declined</CardTitle>
                <CardDescription>You can re-accept these</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={handleClearDeclined}>
                <Trash2 className="h-4 w-4 mr-1" />Clear
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {declined.map(c => (
                <CollabCard
                  key={c.id}
                  collab={c}
                  onReaccept={() => onStatusChange(c.id, 'accepted')}
                  onDelete={() => onDelete(c.id)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Past */}
      {past.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Past</CardTitle>
            <CardDescription>Previously collaborated events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {past.map(c => (
                <CollabCard key={c.id} collab={c} faded />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// HostingSection — events a club hosts that have accepted collaborators
// ---------------------------------------------------------------------------
interface HostingSectionProps {
  clubId: string;
}

function HostingSection({ clubId }: HostingSectionProps) {
  const { events, clubs } = useApp();
  const navigate = useNavigate();
  const now = new Date();

  const hostedWithCollabs = events.filter(
    e => e.clubId === clubId && e.collaborators && e.collaborators.length > 0,
  );
  const upcoming = hostedWithCollabs.filter(e => e.startTime >= now);
  const past = hostedWithCollabs.filter(e => e.startTime < now);

  const clubColorMap: Record<string, string> = {};
  clubs.forEach(c => { clubColorMap[c.id] = c.color; });

  if (hostedWithCollabs.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Hosting</CardTitle>
          <CardDescription>Events you host with collaborating orgs</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">No collaborative events hosted yet</p>
        </CardContent>
      </Card>
    );
  }

  const EventRow = ({ e, faded }: { e: typeof events[0]; faded?: boolean }) => (
    <div
      key={e.id}
      className={`border border-border rounded-lg p-4 cursor-pointer hover:bg-muted/40 transition-colors ${faded ? 'opacity-60' : ''}`}
      onClick={() => navigate(`/event/${e.id}`)}
    >
      <div className="flex items-start gap-3">
        <div className="bg-primary/10 text-primary rounded-lg p-2 mt-1 shrink-0">
          <Calendar className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium truncate">{e.title}</h4>
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            {format(e.startTime, 'EEE, MMM d, yyyy · h:mm a')}
          </p>
          <div className="flex flex-wrap gap-2">
            {e.collaborators!.map(col => (
              <Badge
                key={col.club_id}
                variant="outline"
                className="text-xs"
                style={{ borderColor: clubColorMap[col.club_id], color: clubColorMap[col.club_id] }}
              >
                {col.club_name}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Hosting</CardTitle>
        <CardDescription>Events you host with collaborating orgs</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {upcoming.map(e => <EventRow key={e.id} e={e} />)}
          {past.map(e => <EventRow key={e.id} e={e} faded />)}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Collab page
// ---------------------------------------------------------------------------
export function Collab() {
  const { clubs, currentUser, authToken } = useApp();
  const [collabs, setCollabs] = useState<CollabRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [rootTab, setRootTab] = useState<'all' | 'byClub'>('all');
  const [selectedClubId, setSelectedClubId] = useState<string>('');

  const fetchCollabs = useCallback(async () => {
    if (!authToken) return;
    try {
      const res = await fetch('/api/collab', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setCollabs(await res.json());
    } catch (err: any) {
      toast.error(`Failed to load collaborations: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => { fetchCollabs(); }, [fetchCollabs]);

  const handleStatusChange = async (id: string, status: 'accepted' | 'rejected') => {
    try {
      const res = await fetch(`/api/collab/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success(status === 'accepted' ? 'Collaboration accepted!' : 'Collaboration declined');
      await fetchCollabs();
    } catch {
      toast.error('Failed to update collaboration');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/collab/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setCollabs(prev => prev.filter(c => c.id !== id));
    } catch {
      toast.error('Failed to remove invite');
    }
  };

  const isRoot = currentUser?.role === 'admin';

  const clubIdToName: Record<string, string> = {};
  const clubIdToColor: Record<string, string> = {};
  clubs.forEach(c => { clubIdToName[c.id] = c.name; clubIdToColor[c.id] = c.color; });

  if (loading) {
    return <div className="text-muted-foreground py-8 text-center">Loading collaborations…</div>;
  }

  // -------------------------------------------------------------------------
  // ROOT ADMIN VIEW
  // -------------------------------------------------------------------------
  if (isRoot) {
    const now = new Date();
    const pending = collabs.filter(c => c.status === 'pending');
    const accepted = collabs.filter(c => c.status === 'accepted');
    const upcoming = accepted.filter(c => c.events?.start_time && new Date(c.events.start_time) >= now);

    const byClubCollabs = selectedClubId
      ? collabs.filter(c => c.club_id === selectedClubId)
      : [];

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl mb-1">Collaborations</h2>
          <p className="text-muted-foreground">All collaboration activity across every organization</p>
        </div>

        {/* Tab toggle */}
        <div className="flex gap-2 border-b border-border">
          {(['all', 'byClub'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setRootTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                rootTab === tab
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'all' ? 'All Clubs' : 'By Club'}
            </button>
          ))}
        </div>

        {rootTab === 'all' && (
          <>
            {/* Stats */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Total Collaborations</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-3xl">{collabs.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">All time</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Pending Invites</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-3xl">{pending.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Awaiting response</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Upcoming Accepted</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-3xl">{upcoming.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Active collaborations</p>
                </CardContent>
              </Card>
            </div>

            {/* Full list grouped by status */}
            {(['pending', 'accepted', 'rejected'] as const).map(status => {
              const group = collabs.filter(c => c.status === status);
              if (group.length === 0) return null;
              const labels = { pending: 'Pending', accepted: 'Accepted', rejected: 'Declined' };
              const descriptions = {
                pending: 'Awaiting response from the invited org',
                accepted: 'Confirmed collaborations',
                rejected: 'Declined invites',
              };
              return (
                <Card key={status}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-base">{labels[status]}</CardTitle>
                      <Badge variant="secondary">{group.length}</Badge>
                    </div>
                    <CardDescription>{descriptions[status]}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {group.map(c => (
                        <div key={c.id} className="border border-border rounded-lg p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <p className="font-medium text-sm mb-1">{c.events?.title ?? '—'}</p>
                              {c.events?.start_time && (
                                <p className="text-xs text-muted-foreground mb-2">
                                  {format(new Date(c.events.start_time), 'EEE, MMM d, yyyy · h:mm a')}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-2">
                                {c.events?.clubs?.name && (
                                  <Badge variant="outline" className="text-xs">
                                    Host: {c.events.clubs.name}
                                  </Badge>
                                )}
                                {clubIdToName[c.club_id] && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                    style={{ backgroundColor: `${clubIdToColor[c.club_id]}20`, color: clubIdToColor[c.club_id] }}
                                  >
                                    Invited: {clubIdToName[c.club_id]}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </>
        )}

        {rootTab === 'byClub' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
              <Select value={selectedClubId} onValueChange={setSelectedClubId}>
                <SelectTrigger className="w-72">
                  <SelectValue placeholder="Select an organization…" />
                </SelectTrigger>
                <SelectContent>
                  {clubs.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!selectedClubId && (
              <div className="text-center py-12 text-muted-foreground">
                Select an organization above to view their collaboration activity
              </div>
            )}

            {selectedClubId && (
              <div className="space-y-4">
                <HostingSection clubId={selectedClubId} />
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-3 ml-1">Collaboration Invites Received</p>
                  {byClubCollabs.length === 0 ? (
                    <Card>
                      <CardContent className="py-6 text-center text-sm text-muted-foreground">
                        No collab invites for this organization
                      </CardContent>
                    </Card>
                  ) : (
                    <InvitedSection
                      collabs={byClubCollabs}
                      onStatusChange={handleStatusChange}
                      onDelete={handleDelete}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // CLUB ADMIN VIEW
  // -------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl mb-1">Collaborations</h2>
        <p className="text-muted-foreground">Events you host with partners, and invites you've received</p>
      </div>

      {/* Section divider: Hosting */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2">You're Hosting</span>
          <div className="h-px flex-1 bg-border" />
        </div>
        {currentUser?.clubId
          ? <HostingSection clubId={currentUser.clubId} />
          : (
            <Card>
              <CardContent className="py-6 text-center text-sm text-muted-foreground">
                No club linked to your account
              </CardContent>
            </Card>
          )
        }
      </div>

      {/* Section divider: Invited */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2">You're Invited</span>
          <div className="h-px flex-1 bg-border" />
        </div>
        <InvitedSection
          collabs={collabs}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
