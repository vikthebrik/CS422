import { useParams, useNavigate } from 'react-router';
import { Calendar, Clock, MapPin, Users, Pencil, ArrowLeft, Ticket, X, Plus } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useApp } from '../context/AppContext';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useState } from 'react';
import { toast } from 'sonner';
import { EVENT_TYPES, CollaboratorInfo } from '../types';
import { getLocationUrl } from '../constants';

export function EventPage() {
  const { eventId } = useParams();
  const { events, clubs, currentUser, authToken, updateEvent } = useApp();
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [localCollabs, setLocalCollabs] = useState<CollaboratorInfo[]>([]);
  const [addClubId, setAddClubId] = useState<string>('');
  const [collabLoading, setCollabLoading] = useState(false);

  const event = events.find(e => e.id === eventId);
  const club = event ? clubs.find(c => c.id === event.clubId) : null;

  const canEdit = currentUser && (currentUser.role === 'admin' || currentUser.clubId === event?.clubId);

  if (!event || !club) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl mb-2">Event not found</h2>
        <Button onClick={() => navigate('/')}>Back to Dashboard</Button>
      </div>
    );
  }

  const openEditModal = () => {
    setLocalCollabs(event?.collaborators ?? []);
    setAddClubId('');
    setIsEditModalOpen(true);
  };

  const handleAddCollaborator = async () => {
    if (!addClubId || !event) return;
    setCollabLoading(true);
    try {
      const res = await fetch(`/api/events/${event.id}/collaborators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ clubId: addClubId }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error);
      }
      const addedClub = clubs.find(c => c.id === addClubId)!;
      const newCollab: CollaboratorInfo = { club_id: addClubId, club_name: addedClub.name, club_logo: addedClub.logo };
      const updated = [...localCollabs, newCollab];
      setLocalCollabs(updated);
      updateEvent(event.id, { collaborators: updated });
      setAddClubId('');
      toast.success(`${addedClub.name} added as collaborator`);
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to add collaborator');
    } finally {
      setCollabLoading(false);
    }
  };

  const handleRemoveCollaborator = async (clubId: string) => {
    if (!event) return;
    setCollabLoading(true);
    try {
      const res = await fetch(`/api/events/${event.id}/collaborators/${clubId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) throw new Error('Failed to remove collaborator');
      const updated = localCollabs.filter(c => c.club_id !== clubId);
      setLocalCollabs(updated);
      updateEvent(event.id, { collaborators: updated });
      toast.success('Collaborator removed');
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to remove collaborator');
    } finally {
      setCollabLoading(false);
    }
  };

  const handleSaveEvent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const eventData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      location: formData.get('location') as string,
      eventType: formData.get('eventType') as string,
    };

    updateEvent(event.id, eventData);
    toast.success('Event updated successfully');
    setIsEditModalOpen(false);
  };

  const duration = (event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60 * 60);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back Button */}
      <Button variant="outline" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      {/* Event Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary">{event.eventType}</Badge>
                <Badge
                  className="text-white"
                  style={{ backgroundColor: club.color }}
                >
                  <Users className="h-3 w-3 mr-1" />
                  {club.name}
                </Badge>
              </div>
              <CardTitle className="text-3xl mb-2">{event.title}</CardTitle>
            </div>
            {canEdit && (
              <Button onClick={openEditModal} className="bg-primary shrink-0">
                <Pencil className="h-4 w-4 mr-2" />
                Edit Event
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Event Details Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Date & Time Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Date & Time
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Date</div>
              <div className="font-medium">{format(event.startTime, 'EEEE, MMMM d, yyyy')}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Time</div>
              <div className="font-medium">
                {format(event.startTime, 'h:mm a')} - {format(event.endTime, 'h:mm a')}
              </div>
              <div className="text-sm text-muted-foreground">
                Duration: {Math.round(duration * 10) / 10} {duration === 1 ? 'hour' : 'hours'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-medium text-lg">{event.location}</div>
            {(() => {
              const { url, label } = getLocationUrl(event.location);
              return (
                <Button variant="link" className="px-0 text-primary" asChild>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    {label} →
                  </a>
                </Button>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      {/* RSVP / Tickets */}
      {event.requiresRsvp && event.rsvpLink && (
        <a
          href={event.rsvpLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center gap-0.5 w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
        >
          <span className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            Tickets / RSVP
          </span>
          <span className="text-xs font-normal opacity-80">Click here to register</span>
        </a>
      )}

      {/* Description Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">About This Event</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">{event.description}</p>
        </CardContent>
      </Card>

      {/* Host Organization Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Host Organization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center text-white overflow-hidden shrink-0"
                style={{ backgroundColor: club.color }}
              >
                {club.logo ? (
                  <img src={club.logo} alt={club.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg">{club.name.substring(0, 2)}</span>
                )}
              </div>
              <div>
                <div className="font-medium text-lg">{club.name}</div>
                <div className="text-sm text-muted-foreground">{club.description}</div>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate(`/club/${club.id}`)}>
              View Club
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Secondary Collaborators */}
      {event.collaborators && event.collaborators.filter(c => c.club_id !== event.clubId).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Collaborating Organizations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {event.collaborators.filter(c => c.club_id !== event.clubId).map(collab => {
              const collabClub = clubs.find(c => c.id === collab.club_id);
              if (!collabClub) return null;
              return (
                <div key={collab.club_id} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-white overflow-hidden shrink-0"
                      style={{ backgroundColor: collabClub.color }}
                    >
                      {collabClub.logo ? (
                        <img src={collabClub.logo} alt={collabClub.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg">{collabClub.name.substring(0, 2)}</span>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-lg">{collabClub.name}</div>
                      <div className="text-sm text-muted-foreground">{collabClub.description}</div>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => navigate(`/club/${collab.club_id}`)}>
                    View Club
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Edit Event Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>Update event details</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveEvent} className="space-y-4">
            <div>
              <Label htmlFor="title">Event Title</Label>
              <Input id="title" name="title" defaultValue={event.title} required />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" defaultValue={event.description} rows={4} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="eventType">Event Type</Label>
                <Select name="eventType" defaultValue={event.eventType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map(type => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input id="location" name="location" defaultValue={event.location} required />
              </div>
            </div>
            {/* Collaborators */}
            <div>
              <Label>Collaborating Clubs</Label>
              <p className="text-xs text-muted-foreground mb-2">
                These clubs will appear as co-hosts on the event
              </p>
              <div className="space-y-2 mb-3">
                {localCollabs.length === 0 && (
                  <p className="text-sm text-muted-foreground">No collaborators yet</p>
                )}
                {localCollabs.map(c => (
                  <div key={c.club_id} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                    <div className="flex items-center gap-2">
                      {c.club_logo
                        ? <img src={c.club_logo} alt="" className="w-5 h-5 rounded object-cover" />
                        : <div className="w-5 h-5 rounded bg-muted" />}
                      <span className="text-sm font-medium">{c.club_name}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={collabLoading}
                      onClick={() => handleRemoveCollaborator(c.club_id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              {/* Add collaborator */}
              <div className="flex gap-2">
                <Select value={addClubId} onValueChange={setAddClubId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a club to add…" />
                  </SelectTrigger>
                  <SelectContent>
                    {clubs
                      .filter(c => c.id !== event.clubId && !localCollabs.some(lc => lc.club_id === c.id))
                      .map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!addClubId || collabLoading}
                  onClick={handleAddCollaborator}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary">
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
