import { useState, useEffect, useCallback } from 'react';
import { Pencil, Trash2, Search, Settings, Calendar, MapPin, Clock, Instagram, Link as LinkIcon, Globe, Plus, X, Ticket, AlertTriangle } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { useApp } from '../context/AppContext';
import { getUpcomingClubEvents } from '../constants';
import { Event, EVENT_TYPES } from '../types';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { LogoUpload } from '../components/LogoUpload';

interface EventType { id: string; name: string; }

export function Admin() {
  const { events, clubs, currentUser, authToken, updateEvent, deleteEvent, updateClub, addEvent } = useApp();

  // Helper: authenticated API call
  const apiCall = useCallback((method: string, path: string, body?: object) =>
    fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    }), [authToken]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isManageOrgsModalOpen, setIsManageOrgsModalOpen] = useState(false);
  const [isEditClubModalOpen, setIsEditClubModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  // Controlled state for the event type select so FormData doesn't lose the value
  const [editingEventType, setEditingEventType] = useState('');
  const [createEventType, setCreateEventType] = useState('');
  const [createClubId, setCreateClubId] = useState('');
  const [defaultStart, setDefaultStart] = useState('');
  const [defaultEnd, setDefaultEnd] = useState('');
  // Confirm dialogs (replaces browser confirm())
  const [deleteEventConfirm, setDeleteEventConfirm] = useState<Event | null>(null);
  const [deleteTypeConfirm, setDeleteTypeConfirm] = useState<EventType | null>(null);

  // Event Types state (root admin only)
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [newTypeName, setNewTypeName] = useState('');
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [editingTypeName, setEditingTypeName] = useState('');

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
      toast.success('Event type deleted');
    } catch { toast.error('Could not reach the server'); }
    setDeleteTypeConfirm(null);
  };

  const isAdmin = currentUser?.role === 'admin';
  const isClubAdmin = currentUser?.role === 'club_officer';

  // Get the club for club admins
  const userClub = isClubAdmin && currentUser?.clubId 
    ? clubs.find(c => c.id === currentUser.clubId) 
    : null;

  // Filter events based on user role
  const visibleEvents = isClubAdmin
    ? events.filter(e => e.clubId === currentUser?.clubId)
    : events;

  const filteredEvents = visibleEvents.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  // Get club events for club admin (upcoming only, ascending, limited)
  const clubEvents = userClub ? getUpcomingClubEvents(events, userClub.id) : [];

  const autoDetectEventType = (description: string, setter: (v: string) => void = setEditingEventType) => {
    const text = description.toLowerCase();
    const typeNames = eventTypes.length > 0 ? eventTypes.map(et => et.name) : [...EVENT_TYPES];
    // Check "office hours" first (more specific than "meeting")
    if (text.includes('office hours')) {
      const match = typeNames.find(t => t.toLowerCase().includes('office hours'));
      if (match) { setter(match); return; }
    }
    if (text.includes('meeting')) {
      const match = typeNames.find(t => t.toLowerCase().includes('meeting'));
      if (match) { setter(match); return; }
    }
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setEditingEventType(event.eventType);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (eventId: string) => {
    try {
      const res = await apiCall('DELETE', `/events/${eventId}`);
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error ?? 'Failed to delete event');
        return;
      }
      deleteEvent(eventId);
      toast.success('Event deleted');
    } catch {
      toast.error('Could not reach the server');
    }
    setDeleteEventConfirm(null);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingEvent) return;
    const formData = new FormData(e.currentTarget);

    const rsvpLinkVal = (formData.get('rsvpLink') as string | null) || null;
    const eventData: Partial<Event> = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      location: formData.get('location') as string,
      eventType: editingEventType,
      rsvpLink: rsvpLinkVal,
      requiresRsvp: editingEvent.requiresRsvp || !!rsvpLinkVal,
    };

    try {
      const res = await apiCall('PATCH', `/events/${editingEvent.id}`, {
        title: eventData.title,
        description: eventData.description,
        location: eventData.location,
        eventType: eventData.eventType,
        rsvpLink: rsvpLinkVal,
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error ?? 'Failed to update event');
        return;
      }
      updateEvent(editingEvent.id, eventData);
      toast.success('Event updated');
    } catch {
      toast.error('Could not reach the server');
      return;
    }

    setIsEditModalOpen(false);
    setEditingEvent(null);
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const startVal = formData.get('startTime') as string;
    const endVal = formData.get('endTime') as string;
    const rsvpLinkVal = (formData.get('rsvpLink') as string | null) || null;
    const clubIdVal = createClubId || currentUser?.clubId || '';
    if (!clubIdVal) { toast.error('Please select an organization'); return; }

    try {
      const res = await apiCall('POST', '/events', {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        location: formData.get('location') as string,
        eventType: createEventType || undefined,
        clubId: clubIdVal,
        startTime: new Date(startVal).toISOString(),
        endTime: new Date(endVal).toISOString(),
        rsvpLink: rsvpLinkVal,
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
        requiresRsvp: data.requires_rsvp ?? false,
        rsvpLink: data.rsvp_link ?? null,
      });
      toast.success('Event created');
      setIsCreateModalOpen(false);
      setCreateEventType('');
      setCreateClubId('');
    } catch {
      toast.error('Could not reach the server');
    }
  };

  const openCreateModal = () => {
    // Default start/end to next upcoming hour
    const now = new Date();
    now.setMinutes(0, 0, 0);
    now.setHours(now.getHours() + 1);
    const end = new Date(now);
    end.setHours(end.getHours() + 1);
    const toLocal = (d: Date) => {
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    setDefaultStart(toLocal(now));
    setDefaultEnd(toLocal(end));
    setCreateClubId(isAdmin ? (clubs[0]?.id ?? '') : (currentUser?.clubId ?? ''));
    setCreateEventType('');
    setIsCreateModalOpen(true);
  };

  const handleSaveClubInfo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userClub) return;
    const formData = new FormData(e.currentTarget);

    const clubData = {
      description: formData.get('club-description') as string,
      instagram: formData.get('club-instagram') as string,
      linktree: formData.get('club-linktree') as string,
      engage: formData.get('club-engage') as string,
      outlookLink: formData.get('club-ics-url') as string,
    };

    try {
      const res = await apiCall('PATCH', `/clubs/${userClub.id}`, clubData);
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error ?? 'Failed to update club');
        return;
      }
      updateClub(userClub.id, clubData);
      toast.success('Club information updated');
    } catch {
      toast.error('Could not reach the server');
      return;
    }

    setIsEditClubModalOpen(false);
  };

  // For club admins, show club page view
  if (isClubAdmin && userClub) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl mb-1">Organization Administration</h2>
          <p className="text-muted-foreground">
            Manage your organization profile and events
          </p>
        </div>

        {/* Club Header */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-6">
              <div 
                className="w-24 h-24 rounded-lg flex items-center justify-center text-white shrink-0"
                style={{ backgroundColor: userClub.color }}
              >
                {userClub.logo ? (
                  <ImageWithFallback
                    src={userClub.logo}
                    alt={`${userClub.name} logo`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <span className="text-4xl">{userClub.name.substring(0, 2)}</span>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-3xl mb-2">{userClub.name}</CardTitle>
                    <CardDescription className="text-base">
                      {userClub.description || 'Student organization at the University of Oregon'}
                    </CardDescription>
                  </div>
                  <Button onClick={() => setIsEditClubModalOpen(true)} variant="outline" size="sm">
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Organization Info
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {userClub.instagram && (
                <a
                  href={userClub.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors"
                >
                  <Instagram className="h-4 w-4" />
                  <span className="text-sm">Instagram</span>
                </a>
              )}
              {userClub.linktree && (
                <a
                  href={userClub.linktree}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors"
                >
                  <LinkIcon className="h-4 w-4" />
                  <span className="text-sm">Linktree</span>
                </a>
              )}
              {userClub.engage && (
                <a
                  href={userClub.engage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors"
                >
                  <Globe className="h-4 w-4" />
                  <span className="text-sm">Engage</span>
                </a>
              )}
            </div>
          </CardContent>
        </Card>

        {/* RSVP alert — events flagged as requiring tickets but missing the link */}
        {(() => {
          const missing = clubEvents.filter(e => e.requiresRsvp && !e.rsvpLink);
          if (missing.length === 0) return null;
          return (
            <Card className="border-destructive/40 bg-destructive/5">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground mb-1">Missing ticket / RSVP links</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      {missing.length} event{missing.length !== 1 ? 's' : ''} require
                      {missing.length === 1 ? 's' : ''} an RSVP or ticket link but none has been set.
                      Edit the event and add the RSVP link so attendees can register.
                    </p>
                    <ul className="text-sm space-y-0.5">
                      {missing.map(e => (
                        <li key={e.id} className="flex items-center gap-1.5">
                          <Ticket className="h-3 w-3 text-destructive shrink-0" />
                          <button
                            type="button"
                            className="text-primary underline underline-offset-2 text-left"
                            onClick={() => handleEdit(e)}
                          >
                            {e.title}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* Events Section */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Your Events</CardTitle>
                <CardDescription>Events hosted by {userClub.name}</CardDescription>
              </div>
              <Button size="sm" onClick={openCreateModal}>
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {clubEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No upcoming events scheduled</p>
              </div>
            ) : (
              <div className="space-y-3">
                {clubEvents.map((event) => (
                  <div
                    key={event.id}
                    className="border border-border rounded-lg p-4"
                  >
                    <div className="flex items-start gap-4">
                      <div 
                        className="w-12 h-12 rounded-lg flex flex-col items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: userClub.color }}
                      >
                        <div className="text-xs">{format(event.startTime, 'MMM')}</div>
                        <div className="text-lg leading-none">{format(event.startTime, 'd')}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-medium">{event.title}</h4>
                          <Badge variant="secondary" className="shrink-0">{event.eventType}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {event.description}
                        </p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mb-3">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(event.startTime, 'h:mm a')} - {format(event.endTime, 'h:mm a')}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(event)}
                          >
                            <Pencil className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteEventConfirm(event)}
                          >
                            <Trash2 className="h-3 w-3 mr-1 text-destructive" />
                            Delete
                          </Button>
                          {event.requiresRsvp && event.rsvpLink && (
                            <a
                              href={event.rsvpLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-primary text-primary text-sm font-medium hover:bg-primary/10 transition-colors"
                            >
                              <Ticket className="h-3 w-3" />
                              Tickets
                            </a>
                          )}
                          {event.requiresRsvp && !event.rsvpLink && (
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-destructive/40 text-destructive text-sm">
                              <Ticket className="h-3 w-3" />
                              Missing link
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Club Modal */}
        <Dialog open={isEditClubModalOpen} onOpenChange={setIsEditClubModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Organization Information</DialogTitle>
              <DialogDescription>Update organization details, social media links, and calendar feed</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveClubInfo} className="space-y-4">
              <div>
                <Label>Organization Logo</Label>
                <div className="mt-1">
                  <LogoUpload
                    clubId={userClub.id}
                    currentLogo={userClub.logo}
                    clubColor={userClub.color}
                    clubInitials={userClub.name.substring(0, 2)}
                    authToken={authToken}
                    onUploaded={newUrl => updateClub(userClub.id, { logo: newUrl })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="club-description">Description</Label>
                <Textarea
                  id="club-description"
                  name="club-description"
                  defaultValue={userClub.description}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="club-instagram">Instagram URL</Label>
                  <Input id="club-instagram" name="club-instagram" defaultValue={userClub.instagram} placeholder="https://instagram.com/..." />
                </div>
                <div>
                  <Label htmlFor="club-linktree">Linktree URL</Label>
                  <Input id="club-linktree" name="club-linktree" defaultValue={userClub.linktree} placeholder="https://linktr.ee/..." />
                </div>
              </div>
              <div>
                <Label htmlFor="club-engage">Engage URL</Label>
                <Input id="club-engage" name="club-engage" defaultValue={userClub.engage} placeholder="https://engage.uoregon.edu/..." />
              </div>
              <div>
                <Label htmlFor="club-ics-url">Outlook Calendar ICS URL</Label>
                <Input
                  id="club-ics-url"
                  name="club-ics-url"
                  defaultValue={userClub.outlookLink}
                  placeholder="https://outlook.office365.com/owa/calendar/..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Paste your Outlook shared calendar ICS link here. Events will sync automatically.
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsEditClubModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-primary">
                  Save Changes
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Event Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Event</DialogTitle>
              <DialogDescription>Make changes to event details</DialogDescription>
            </DialogHeader>
            {editingEvent && (
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <Label htmlFor="title">Event Title</Label>
                  <Input id="title" name="title" defaultValue={editingEvent.title} required />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" defaultValue={editingEvent.description} onChange={e => autoDetectEventType(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="clubId">Organization</Label>
                    <Select name="clubId" defaultValue={editingEvent.clubId} disabled>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {clubs.map(club => (
                          <SelectItem key={club.id} value={club.id}>
                            {club.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="eventType">Event Type</Label>
                    <Select value={editingEventType} onValueChange={setEditingEventType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(eventTypes.length > 0 ? eventTypes.map(et => et.name) : [...EVENT_TYPES]).map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" name="location" defaultValue={editingEvent.location} required />
                </div>
                <div>
                  <Label htmlFor="rsvpLink">RSVP / Ticket Link</Label>
                  <Input id="rsvpLink" name="rsvpLink" defaultValue={editingEvent.rsvpLink ?? ''} placeholder="https://..." />
                  <p className="text-xs text-muted-foreground mt-1">Optional. If set, a ticket button will appear on the event.</p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-primary">
                    Save Changes
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Create Event Modal (club admin) */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Event</DialogTitle>
              <DialogDescription>Add a new event for {userClub.name}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="create-title">Event Title</Label>
                <Input id="create-title" name="title" required />
              </div>
              <div>
                <Label htmlFor="create-description">Description</Label>
                <Textarea id="create-description" name="description" onChange={e => autoDetectEventType(e.target.value, setCreateEventType)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Organization</Label>
                  <Input value={userClub.name} disabled />
                </div>
                <div>
                  <Label>Event Type</Label>
                  <Select value={createEventType} onValueChange={setCreateEventType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type…" />
                    </SelectTrigger>
                    <SelectContent>
                      {(eventTypes.length > 0 ? eventTypes.map(et => et.name) : [...EVENT_TYPES]).map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="create-start">Start Date & Time</Label>
                  <Input id="create-start" name="startTime" type="datetime-local" defaultValue={defaultStart} required />
                </div>
                <div>
                  <Label htmlFor="create-end">End Date & Time</Label>
                  <Input id="create-end" name="endTime" type="datetime-local" defaultValue={defaultEnd} required />
                </div>
              </div>
              <div>
                <Label htmlFor="create-location">Location</Label>
                <Input id="create-location" name="location" required />
              </div>
              <div>
                <Label htmlFor="create-rsvp">RSVP / Ticket Link</Label>
                <Input id="create-rsvp" name="rsvpLink" placeholder="https://..." />
                <p className="text-xs text-muted-foreground mt-1">Optional. If set, a ticket button will appear on the event.</p>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-primary">
                  Create Event
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // For upper admins, show the event management table
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl mb-1">Event Management</h2>
          <p className="text-muted-foreground">
            Manage all events across organizations
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Button
              variant="outline"
              onClick={() => setIsManageOrgsModalOpen(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Manage Organizations
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <CardTitle>All Events</CardTitle>
              <CardDescription>Search and manage upcoming events</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full sm:w-64"
                />
              </div>
              <Button size="sm" onClick={openCreateModal}>
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No events found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEvents.map((event) => {
                    const club = clubs.find(c => c.id === event.clubId);
                    return (
                      <TableRow key={event.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{event.title}</div>
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {event.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge style={{ backgroundColor: club?.color, color: 'white' }}>
                            {club?.name}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{event.eventType}</Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="text-sm">{format(event.startTime, 'MMM d, yyyy')}</div>
                            <div className="text-xs text-muted-foreground">
                              {format(event.startTime, 'h:mm a')} - {format(event.endTime, 'h:mm a')}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{event.location}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(event)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteEventConfirm(event)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Event Types Management (root only) */}
      {isAdmin && (
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
      )}

      {/* Edit Event Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>Make changes to event details</DialogDescription>
          </DialogHeader>
          {editingEvent && (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <Label htmlFor="title">Event Title</Label>
                <Input id="title" name="title" defaultValue={editingEvent.title} required />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" defaultValue={editingEvent.description} onChange={e => autoDetectEventType(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clubId">Club</Label>
                  <Select name="clubId" defaultValue={editingEvent.clubId} disabled={!isAdmin}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {clubs.map(club => (
                        <SelectItem key={club.id} value={club.id}>
                          {club.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="eventType">Event Type</Label>
                  <Select value={editingEventType} onValueChange={setEditingEventType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(eventTypes.length > 0 ? eventTypes.map(et => et.name) : [...EVENT_TYPES]).map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input id="location" name="location" defaultValue={editingEvent.location} required />
              </div>
              <div>
                <Label htmlFor="rsvpLink">RSVP / Ticket Link</Label>
                <Input id="rsvpLink" name="rsvpLink" defaultValue={editingEvent.rsvpLink ?? ''} placeholder="https://..." />
                <p className="text-xs text-muted-foreground mt-1">Optional. If set, a ticket button will appear on the event.</p>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-primary">
                  Save Changes
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Event Modal (root admin) */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Event</DialogTitle>
            <DialogDescription>Add a new event to the calendar</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label htmlFor="create-title">Event Title</Label>
              <Input id="create-title" name="title" required />
            </div>
            <div>
              <Label htmlFor="create-description">Description</Label>
              <Textarea id="create-description" name="description" onChange={e => autoDetectEventType(e.target.value, setCreateEventType)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Organization</Label>
                <Select value={createClubId} onValueChange={setCreateClubId}>
                  <SelectTrigger>
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
                  <SelectTrigger>
                    <SelectValue placeholder="Select type…" />
                  </SelectTrigger>
                  <SelectContent>
                    {(eventTypes.length > 0 ? eventTypes.map(et => et.name) : [...EVENT_TYPES]).map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create-start">Start Date & Time</Label>
                <Input id="create-start" name="startTime" type="datetime-local" defaultValue={defaultStart} required />
              </div>
              <div>
                <Label htmlFor="create-end">End Date & Time</Label>
                <Input id="create-end" name="endTime" type="datetime-local" defaultValue={defaultEnd} required />
              </div>
            </div>
            <div>
              <Label htmlFor="create-location">Location</Label>
              <Input id="create-location" name="location" required />
            </div>
            <div>
              <Label htmlFor="create-rsvp">RSVP / Ticket Link</Label>
              <Input id="create-rsvp" name="rsvpLink" placeholder="https://..." />
              <p className="text-xs text-muted-foreground mt-1">Optional. If set, a ticket button will appear on the event.</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary">
                Create Event
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Manage Organizations Modal */}
      <Dialog open={isManageOrgsModalOpen} onOpenChange={setIsManageOrgsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Organizations</DialogTitle>
            <DialogDescription>Add or remove Outlook ICS links and category settings</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {clubs.map(club => (
              <Card key={club.id}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: club.color }} />
                    {club.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label>Outlook ICS Link</Label>
                    <Input defaultValue={club.outlookLink} placeholder="https://outlook.example.com/..." />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Event Confirmation */}
      {deleteEventConfirm && (
        <Dialog open onOpenChange={open => { if (!open) setDeleteEventConfirm(null); }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                  <Trash2 className="h-5 w-5 text-destructive" />
                </div>
                <DialogTitle>Delete event?</DialogTitle>
              </div>
              <DialogDescription>
                "{deleteEventConfirm.title}" will be permanently deleted. This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDeleteEventConfirm(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => handleDelete(deleteEventConfirm.id)}>
                <Trash2 className="h-4 w-4 mr-2" />Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Event Type Confirmation */}
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