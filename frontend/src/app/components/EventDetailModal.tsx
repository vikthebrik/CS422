import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Event } from '../types';
import { format } from 'date-fns';
import { useApp } from '../context/AppContext';

interface EventDetailModalProps {
  event: Event | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EventDetailModal({ event, open, onOpenChange }: EventDetailModalProps) {
  const { clubs } = useApp();

  if (!event) return null;

  const club = clubs.find(c => c.id === event.clubId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">{event.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Event Type & Club */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary">{event.eventType}</Badge>
            {club && (
              <Badge 
                className="text-white"
                style={{ backgroundColor: club.color }}
              >
                <Users className="h-3 w-3 mr-1" />
                {club.name}
              </Badge>
            )}
          </div>

          {/* Description */}
          <div>
            <p className="text-muted-foreground">{event.description}</p>
          </div>

          {/* Details */}
          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <div className="font-medium">
                  {format(event.startTime, 'EEEE, MMMM d, yyyy')}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <div className="font-medium">
                  {format(event.startTime, 'h:mm a')} - {format(event.endTime, 'h:mm a')}
                </div>
                <div className="text-sm text-muted-foreground">
                  Duration: {Math.round((event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60 * 60) * 10) / 10} hours
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <div className="font-medium">{event.location}</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Hosted by <span className="font-medium text-foreground">{club?.name}</span>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
