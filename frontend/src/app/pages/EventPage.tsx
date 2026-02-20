import { useParams, useNavigate } from 'react-router';
import { Calendar, Clock, MapPin, Users, Pencil, ArrowLeft } from 'lucide-react';
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
import { EVENT_TYPES } from '../types';

export function EventPage() {
  const { eventId } = useParams();
  const { events, clubs, currentUser, updateEvent } = useApp();
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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
              <Button onClick={() => setIsEditModalOpen(true)} className="bg-primary shrink-0">
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
            <Button variant="link" className="px-0 text-primary" asChild>
              <a 
                href={`https://maps.google.com/?q=${encodeURIComponent(event.location + ', University of Oregon')}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View on Map →
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>

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
                className="w-12 h-12 rounded-lg flex items-center justify-center text-white"
                style={{ backgroundColor: club.color }}
              >
                <span className="text-lg">{club.name.substring(0, 2)}</span>
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
