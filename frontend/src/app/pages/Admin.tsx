import { useState } from 'react';
import { Pencil, Trash2, Search, Settings, Calendar, MapPin, Clock, Instagram, Link as LinkIcon, Globe } from 'lucide-react';

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
import { Event, EVENT_TYPES } from '../types';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export function Admin() {
  const { events, clubs, currentUser, authToken, updateEvent, deleteEvent, updateClub } = useApp();

  // Helper: authenticated API call
  const apiCall = (method: string, path: string, body?: object) =>
    fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isManageOrgsModalOpen, setIsManageOrgsModalOpen] = useState(false);
  const [isEditClubModalOpen, setIsEditClubModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

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

  // Get club events for club admin
  const clubEvents = userClub 
    ? events.filter(e => e.clubId === userClub.id).sort((a, b) => 
        a.startTime.getTime() - b.startTime.getTime()
      )
    : [];

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
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
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingEvent) return;
    const formData = new FormData(e.currentTarget);

    const eventData: Partial<Event> = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      location: formData.get('location') as string,
      eventType: formData.get('eventType') as string,
    };

    try {
      const res = await apiCall('PATCH', `/events/${editingEvent.id}`, {
        title: eventData.title,
        description: eventData.description,
        location: eventData.location,
        eventType: eventData.eventType,
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

  const handleSaveClubInfo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userClub) return;
    const formData = new FormData(e.currentTarget);

    const clubData = {
      description: formData.get('club-description') as string,
      instagram: formData.get('club-instagram') as string,
      linktree: formData.get('club-linktree') as string,
      engage: formData.get('club-engage') as string,
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
          <h2 className="text-2xl mb-1">Club Administration</h2>
          <p className="text-muted-foreground">
            Manage your club profile and events
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
                    Edit Club Info
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

        {/* Events Section */}
        <Card>
          <CardHeader>
            <CardTitle>Your Events</CardTitle>
            <CardDescription>Events hosted by {userClub.name}</CardDescription>
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
                        <div className="flex gap-2">
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
                            onClick={() => handleDelete(event.id)}
                          >
                            <Trash2 className="h-3 w-3 mr-1 text-destructive" />
                            Delete
                          </Button>
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
              <DialogTitle>Edit Club Information</DialogTitle>
              <DialogDescription>Update club details and social media links</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveClubInfo} className="space-y-4">
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
                  <Textarea id="description" name="description" defaultValue={editingEvent.description} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="clubId">Club</Label>
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
                    <Select name="eventType" defaultValue={editingEvent.eventType}>
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
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" name="location" defaultValue={editingEvent.location} required />
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
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full sm:w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Club</TableHead>
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
                              onClick={() => handleDelete(event.id)}
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
                <Textarea id="description" name="description" defaultValue={editingEvent.description} required />
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
                  <Select name="eventType" defaultValue={editingEvent.eventType}>
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
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input id="location" name="location" defaultValue={editingEvent.location} required />
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
    </div>
  );
}