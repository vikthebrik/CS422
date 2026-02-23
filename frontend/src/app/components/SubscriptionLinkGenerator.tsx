import { useState } from 'react';
import { Calendar, Copy, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';

export function SubscriptionLinkGenerator() {
  const { selectedClubs, selectedEventTypes, clubs, events, typeIdMap } = useApp();
  const [copied, setCopied] = useState(false);

  const generateICSUrl = (): string => {
    if (selectedClubs.length === 0) return '';

    const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

    // Build filter rules: "clubId:typeId" pairs
    // If no event types selected → one rule per club (all types)
    // If event types selected → cross-join clubs × selected type UUIDs
    let rules: string[];

    if (selectedEventTypes.length === 0) {
      rules = selectedClubs.map(clubId => `${clubId}:`);
    } else {
      rules = [];
      selectedClubs.forEach(clubId => {
        selectedEventTypes.forEach(typeName => {
          const typeId = typeIdMap[typeName];
          rules.push(typeId ? `${clubId}:${typeId}` : `${clubId}:`);
        });
      });
    }

    return `${baseUrl}/events/ics?filters=${encodeURIComponent(rules.join(','))}`;
  };

  const icsUrl = generateICSUrl();

  // Count matching events locally so the UI can show how many will be included
  const filteredCount = events.filter(event => {
    const clubMatch = selectedClubs.includes(event.clubId);
    const typeMatch =
      selectedEventTypes.length === 0 || selectedEventTypes.includes(event.eventType);
    return clubMatch && typeMatch;
  }).length;

  const selectedClubNames = selectedClubs
    .map(id => clubs.find(c => c.id === id)?.name)
    .filter(Boolean)
    .join(', ');

  const copyToClipboard = async () => {
    if (!icsUrl) {
      toast.error('Please select at least one club to generate a calendar link');
      return;
    }
    try {
      await navigator.clipboard.writeText(icsUrl);
      setCopied(true);
      toast.success('Calendar link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

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
                Selected clubs:{' '}
                <span className="font-medium text-foreground">{selectedClubNames}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Events to include:{' '}
                <span className="font-medium text-foreground">{filteredCount}</span>
              </p>
            </div>
            <div className="flex gap-2">
              <Input
                value={icsUrl}
                readOnly
                className="font-mono text-xs"
              />
              <Button onClick={copyToClipboard} className="shrink-0">
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
                <li>Copy the calendar link above</li>
                <li>In Google Calendar: Settings → Add calendar → From URL → paste the link</li>
                <li>In Apple Calendar: File → New Calendar Subscription → paste the link</li>
                <li>In Outlook: Add calendar → Subscribe from web → paste the link</li>
              </ol>
              <p className="text-xs text-muted-foreground mt-2">
                The link stays live — your calendar app will automatically receive new events.
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
