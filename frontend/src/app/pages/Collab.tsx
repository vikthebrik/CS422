import { useState, useEffect, useCallback } from 'react';
import { Users, Clock, Check, X, Calendar, ExternalLink, RotateCcw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
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

export function Collab() {
  const { clubs, currentUser, authToken } = useApp();
  const navigate = useNavigate();
  const [collabs, setCollabs] = useState<CollabRecord[]>([]);
  const [loading, setLoading] = useState(true);

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
      const data: CollabRecord[] = await res.json();
      setCollabs(data);
    } catch (err: any) {
      toast.error(`Failed to load collaborations: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => { fetchCollabs(); }, [fetchCollabs]);

  const handleStatusChange = async (collabId: string, status: 'accepted' | 'rejected') => {
    try {
      const res = await fetch(`/api/collab/${collabId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success(status === 'accepted' ? 'Collaboration accepted!' : 'Collaboration declined');
      await fetchCollabs();
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      toast.error('Failed to update collaboration');
    }
  };

  const pending = collabs.filter(c => c.status === 'pending');
  const accepted = collabs.filter(c => c.status === 'accepted');
  const rejected = collabs.filter(c => c.status === 'rejected');

  const clubColorMap: Record<string, string> = {};
  clubs.forEach(c => { clubColorMap[c.id] = c.color; });

  if (loading) {
    return <div className="text-muted-foreground py-8 text-center">Loading collaborations…</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl mb-1">Collaborations</h2>
        <p className="text-muted-foreground">
          Events your club has been invited to collaborate on via Outlook Calendar
        </p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Total Collaborations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{collabs.length}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Pending Invites</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{pending.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting response</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Active Partnerships</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl">
              {new Set(accepted.map(c => c.events?.clubs?.name).filter(Boolean)).size}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Unique collaborating clubs</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending invites */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Invites</CardTitle>
          <CardDescription>Events you've been invited to collaborate on</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pending.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">No pending invites</div>
            )}
            {pending.map(collab => (
              <div key={collab.id} className="border border-border rounded-lg p-4">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg p-2 mt-1">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium mb-1">{collab.events?.title ?? '—'}</h4>
                      {collab.events?.start_time && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {format(new Date(collab.events.start_time), 'EEEE, MMMM d, yyyy · h:mm a')}
                        </p>
                      )}
                      {collab.events?.clubs?.name && (
                        <Badge variant="outline">
                          Hosted by {collab.events.clubs.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 sm:flex-col">
                    <Button size="sm" className="bg-primary" onClick={() => handleStatusChange(collab.id, 'accepted')}>
                      <Check className="h-4 w-4 mr-1" />
                      Accept
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleStatusChange(collab.id, 'rejected')}>
                      <X className="h-4 w-4 mr-1" />
                      Decline
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Declined collaborations */}
      {rejected.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Declined Invites</CardTitle>
            <CardDescription>Collaborations you previously declined — you can re-accept them</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {rejected.map(collab => (
                <div key={collab.id} className="border border-border rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="bg-muted text-muted-foreground rounded-lg p-2 mt-1">
                        <X className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium mb-1">{collab.events?.title ?? '—'}</h4>
                        {collab.events?.start_time && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {format(new Date(collab.events.start_time), 'EEEE, MMMM d, yyyy · h:mm a')}
                          </p>
                        )}
                        {collab.events?.clubs?.name && (
                          <Badge variant="outline">Hosted by {collab.events.clubs.name}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 sm:flex-col">
                      <Button size="sm" variant="outline" onClick={() => handleStatusChange(collab.id, 'accepted')}>
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Re-accept
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Accepted collaborations */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Collaborative Events</CardTitle>
          <CardDescription>Accepted multi-club events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {accepted.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">No accepted collaborations yet</div>
            )}
            {accepted.map(collab => {
              const hostClub = clubs.find(c => c.name === collab.events?.clubs?.name);
              const myClub = clubs.find(c => c.id === currentUser?.clubId);
              return (
                <div
                  key={collab.id}
                  className="border border-border rounded-lg p-4"
                >
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div
                      className="flex items-start gap-3 flex-1 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => collab.events?.id && navigate(`/event/${collab.events.id}`)}
                    >
                      <div className="bg-primary/10 text-primary rounded-lg p-2 mt-1">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{collab.events?.title ?? '—'}</h4>
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        </div>
                        {collab.events?.start_time && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {format(new Date(collab.events.start_time), 'EEEE, MMMM d, yyyy · h:mm a')}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {hostClub && (
                            <Badge style={{ backgroundColor: hostClub.color, color: 'white' }}>
                              {hostClub.name} (Host)
                            </Badge>
                          )}
                          {myClub && (
                            <Badge variant="outline" style={{ borderColor: myClub.color, color: myClub.color }}>
                              {myClub.name} (You)
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 sm:flex-col">
                      <Button size="sm" variant="outline" onClick={() => handleStatusChange(collab.id, 'rejected')}>
                        <X className="h-4 w-4 mr-1" />
                        Decline
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
