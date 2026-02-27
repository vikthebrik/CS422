import { useParams, useNavigate } from 'react-router';
import { Instagram, Link as LinkIcon, Globe, Calendar, MapPin, Clock, Pencil, Search, ChevronDown, ChevronUp, Ticket } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useApp } from '../context/AppContext';
import { getUpcomingClubEvents, getPastClubEvents } from '../constants';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { LogoUpload } from '../components/LogoUpload';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { Event } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

export function ClubPage() {
  const { clubId } = useParams();
  const { clubs, events, currentUser, authToken, updateClub, eventTypeNames } = useApp();
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [showPast, setShowPast] = useState(false);

  const club = clubs.find(c => c.id === clubId);
  const allUpcoming = clubId ? getUpcomingClubEvents(events, clubId) : [];
  const allPast = clubId ? getPastClubEvents(events, clubId) : [];

  const filterEvents = (evts: Event[]) => {
    let result = evts;
    if (selectedType !== 'all') {
      result = result.filter(e => e.eventType === selectedType);
    }
    if (localSearch.trim()) {
      const q = localSearch.toLowerCase();
      result = result.filter(
        e => e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q)
      );
    }
    return result;
  };

  const upcomingEvents = useMemo(() => filterEvents(allUpcoming), [allUpcoming, selectedType, localSearch]);
  const pastEvents = useMemo(() => filterEvents(allPast), [allPast, selectedType, localSearch]);

  const canEdit = currentUser && (currentUser.role === 'admin' || currentUser.clubId === clubId);

  if (!club) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl mb-2">Organization not found</h2>
        <Button onClick={() => navigate('/clubs')}>Back to Club Roster</Button>
      </div>
    );
  }

  const handleSaveClubInfo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const clubData = {
      description: formData.get('club-description') as string,
      instagram: formData.get('club-instagram') as string,
      linktree: formData.get('club-linktree') as string,
      engage: formData.get('club-engage') as string,
      outlookLink: formData.get('club-ics-url') as string,
    };

    try {
      const res = await fetch(`${API_BASE}/clubs/${club.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify(clubData),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error ?? 'Failed to update club');
        return;
      }
    } catch {
      toast.error('Could not reach the server');
      return;
    }

    updateClub(club.id, clubData);
    toast.success('Club information updated successfully');
    setIsEditModalOpen(false);
  };

  const renderEventCard = (event: Event) => (
    <button
      key={event.id}
      onClick={() => navigate(`/event/${event.id}`)}
      className="w-full text-left border border-border rounded-lg p-4 hover:bg-accent transition-colors"
    >
      <div className="flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-lg flex flex-col items-center justify-center text-white shrink-0"
          style={{ backgroundColor: club.color }}
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
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(event.startTime, 'MMM d, yyyy')} · {format(event.startTime, 'h:mm a')} - {format(event.endTime, 'h:mm a')}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {event.location}
            </span>
            {event.requiresRsvp && event.rsvpLink && (
              <a
                href={event.rsvpLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90"
              >
                <Ticket className="h-3 w-3" />
                Tickets / RSVP
              </a>
            )}
          </div>
        </div>
      </div>
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="outline" onClick={() => navigate('/clubs')}>
        ← Back to Club Roster
      </Button>

      {/* Club Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-6">
            <div
              className="w-24 h-24 rounded-lg flex items-center justify-center text-white shrink-0"
              style={{ backgroundColor: club.color }}
            >
              {club.logo ? (
                <ImageWithFallback
                  src={club.logo}
                  alt={`${club.name} logo`}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <span className="text-4xl">{club.name.substring(0, 2)}</span>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-3xl">{club.name}</CardTitle>
                    <Badge variant="secondary">
                      {club.orgType === 'department' ? 'Department' : 'Union'}
                    </Badge>
                  </div>
                  <CardDescription className="text-base">
                    {club.description || 'Student organization at the University of Oregon'}
                  </CardDescription>
                </div>
                {canEdit && (
                  <Button onClick={() => setIsEditModalOpen(true)} variant="outline" size="sm">
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Organization Info
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {club.instagram && (
              <a
                href={club.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors"
              >
                <Instagram className="h-4 w-4" />
                <span className="text-sm">Instagram</span>
              </a>
            )}
            {club.linktree && (
              <a
                href={club.linktree}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors"
              >
                <LinkIcon className="h-4 w-4" />
                <span className="text-sm">Linktree</span>
              </a>
            )}
            {club.engage && (
              <a
                href={club.engage}
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

      {/* Events */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle>Events</CardTitle>
              <CardDescription>Events hosted by {club.name}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search…"
                  value={localSearch}
                  onChange={e => setLocalSearch(e.target.value)}
                  className="pl-8 h-8 text-sm w-40"
                />
              </div>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="h-8 text-sm w-36">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {eventTypeNames.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upcoming */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Upcoming</h4>
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Calendar className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No upcoming events{localSearch || selectedType !== 'all' ? ' matching filters' : ''}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map(renderEventCard)}
              </div>
            )}
          </div>

          {/* Past events toggle */}
          <div className="border-t pt-3">
            <button
              type="button"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowPast(v => !v)}
            >
              {showPast ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {showPast ? 'Hide past events' : `Show past events (${allPast.length})`}
            </button>

            {showPast && (
              <div className="mt-3 space-y-3">
                {pastEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No past events{localSearch || selectedType !== 'all' ? ' matching filters' : ''}
                  </p>
                ) : (
                  pastEvents.map(renderEventCard)
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Club Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
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
                  clubId={club.id}
                  currentLogo={club.logo}
                  clubColor={club.color}
                  clubInitials={club.name.substring(0, 2)}
                  authToken={authToken}
                  onUploaded={newUrl => updateClub(club.id, { logo: newUrl })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="club-description">Description</Label>
              <Textarea
                id="club-description"
                name="club-description"
                defaultValue={club.description}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="club-instagram">Instagram URL</Label>
                <Input id="club-instagram" name="club-instagram" defaultValue={club.instagram} placeholder="https://instagram.com/..." />
              </div>
              <div>
                <Label htmlFor="club-linktree">Linktree URL</Label>
                <Input id="club-linktree" name="club-linktree" defaultValue={club.linktree} placeholder="https://linktr.ee/..." />
              </div>
            </div>
            <div>
              <Label htmlFor="club-engage">Engage URL</Label>
              <Input id="club-engage" name="club-engage" defaultValue={club.engage} placeholder="https://engage.uoregon.edu/..." />
            </div>
            <div>
              <Label htmlFor="club-ics-url">Outlook Calendar ICS URL</Label>
              <Input
                id="club-ics-url"
                name="club-ics-url"
                defaultValue={club.outlookLink}
                placeholder="https://outlook.office365.com/owa/calendar/..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                Paste your Outlook shared calendar ICS link here. Events will sync automatically.
              </p>
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
