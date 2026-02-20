import { useState } from 'react';
import { Calendar, Copy, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

export function SubscriptionLinkGenerator() {
  const { selectedClubs, clubs, events } = useApp();
  const [copied, setCopied] = useState(false);

  const generateICS = () => {
    if (selectedClubs.length === 0) {
      return '';
    }
    
    // Filter events for selected clubs
    const filteredEvents = events.filter(event => 
      selectedClubs.includes(event.clubId)
    );

    if (filteredEvents.length === 0) {
      return '';
    }

    // Format date for ICS (YYYYMMDDTHHMMSS)
    const formatICSDate = (date: Date) => {
      return format(date, "yyyyMMdd'T'HHmmss");
    };

    // Generate ICS content
    let icsContent = 'BEGIN:VCALENDAR\r\n';
    icsContent += 'VERSION:2.0\r\n';
    icsContent += 'PRODID:-//University of Oregon MCC//Event Calendar//EN\r\n';
    icsContent += 'CALSCALE:GREGORIAN\r\n';
    icsContent += 'METHOD:PUBLISH\r\n';
    icsContent += 'X-WR-CALNAME:MCC Events - ' + selectedClubs.map(id => clubs.find(c => c.id === id)?.name).join(', ') + '\r\n';
    icsContent += 'X-WR-TIMEZONE:America/Los_Angeles\r\n';

    filteredEvents.forEach(event => {
      const club = clubs.find(c => c.id === event.clubId);
      
      icsContent += 'BEGIN:VEVENT\r\n';
      icsContent += `UID:${event.id}@mcc.uoregon.edu\r\n`;
      icsContent += `DTSTAMP:${formatICSDate(new Date())}\r\n`;
      icsContent += `DTSTART:${formatICSDate(event.startTime)}\r\n`;
      icsContent += `DTEND:${formatICSDate(event.endTime)}\r\n`;
      icsContent += `SUMMARY:${event.title}\r\n`;
      icsContent += `DESCRIPTION:${event.description}${club ? ' - ' + club.name : ''}\r\n`;
      icsContent += `LOCATION:${event.location}\r\n`;
      icsContent += `CATEGORIES:${event.eventType}\r\n`;
      if (club) {
        icsContent += `ORGANIZER;CN=${club.name}:MAILTO:mcc@uoregon.edu\r\n`;
      }
      icsContent += 'STATUS:CONFIRMED\r\n';
      icsContent += 'END:VEVENT\r\n';
    });

    icsContent += 'END:VCALENDAR\r\n';

    // Create data URI
    return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(icsContent);
  };

  const icsLink = generateICS();

  const copyToClipboard = async () => {
    if (!icsLink) {
      toast.error('Please select at least one club to generate calendar link');
      return;
    }

    try {
      await navigator.clipboard.writeText(icsLink);
      setCopied(true);
      toast.success('Calendar link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const selectedClubNames = selectedClubs
    .map(id => clubs.find(c => c.id === id)?.name)
    .filter(Boolean)
    .join(', ');

  const filteredEvents = events.filter(event => 
    selectedClubs.includes(event.clubId)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Add To Your Calendar
        </CardTitle>
        <CardDescription>
          Get a calendar link (.ics) with events from your selected clubs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectedClubs.length > 0 ? (
          <>
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Selected clubs: <span className="font-medium text-foreground">{selectedClubNames}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Events to include: <span className="font-medium text-foreground">{filteredEvents.length}</span>
              </p>
            </div>
            <div className="flex gap-2">
              <Input
                value={icsLink}
                readOnly
                className="font-mono text-xs"
              />
              <Button
                onClick={copyToClipboard}
                className="shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <div className="bg-muted rounded-lg p-4 space-y-2">
              <p className="text-xs font-medium">How to use:</p>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Copy the ICS link above</li>
                <li>Paste it into your browser's address bar</li>
                <li>Your calendar app will open and ask to import the events</li>
                <li>Confirm to add all {filteredEvents.length} events to your calendar</li>
              </ol>
              <p className="text-xs text-muted-foreground mt-2">
                Compatible with: Google Calendar, Apple Calendar, Outlook, and most calendar applications
              </p>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Select clubs from the filters to generate a calendar link</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}