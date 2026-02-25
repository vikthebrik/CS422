import { useParams, useNavigate } from 'react-router';
import { Instagram, Link as LinkIcon, Globe, Calendar, MapPin, Clock, Pencil } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useApp } from '../context/AppContext';
import { getUpcomingClubEvents } from '../constants';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { useState } from 'react';
import { toast } from 'sonner';

export function ClubPage() {
  const { clubId } = useParams();
  const { clubs, events, currentUser, updateClub } = useApp();
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const club = clubs.find(c => c.id === clubId);
  const clubEvents = clubId ? getUpcomingClubEvents(events, clubId) : [];

  const canEdit = currentUser && (currentUser.role === 'admin' || currentUser.clubId === clubId);

  if (!club) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl mb-2">Club not found</h2>
        <Button onClick={() => navigate('/clubs')}>Back to Club Roster</Button>
      </div>
    );
  }

  const handleSaveClubInfo = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const clubData = {
      description: formData.get('club-description') as string,
      instagram: formData.get('club-instagram') as string,
      linktree: formData.get('club-linktree') as string,
      engage: formData.get('club-engage') as string,
    };

    updateClub(club.id, clubData);
    toast.success('Club information updated successfully');
    setIsEditModalOpen(false);
  };

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
                  <CardTitle className="text-3xl mb-2">{club.name}</CardTitle>
                  <CardDescription className="text-base">
                    {club.description || 'Student organization at the University of Oregon'}
                  </CardDescription>
                </div>
                {canEdit && (
                  <Button onClick={() => setIsEditModalOpen(true)} variant="outline" size="sm">
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Club Info
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

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
          <CardDescription>Events hosted by {club.name}</CardDescription>
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
                          {format(event.startTime, 'h:mm a')} - {format(event.endTime, 'h:mm a')}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Club Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
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
                defaultValue={club.description}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="club-instagram">Instagram URL</Label>
                <Input id="club-instagram" defaultValue={club.instagram} placeholder="https://instagram.com/..." />
              </div>
              <div>
                <Label htmlFor="club-linktree">Linktree URL</Label>
                <Input id="club-linktree" defaultValue={club.linktree} placeholder="https://linktr.ee/..." />
              </div>
            </div>
            <div>
              <Label htmlFor="club-engage">Engage URL</Label>
              <Input id="club-engage" defaultValue={club.engage} placeholder="https://engage.uoregon.edu/..." />
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