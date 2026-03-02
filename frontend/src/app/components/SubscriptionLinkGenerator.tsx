import { Calendar, Construction } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

export function SubscriptionLinkGenerator() {
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
      <CardContent>
        <div className="text-center py-8 space-y-3">
          <Construction className="h-10 w-10 mx-auto text-amber-500 opacity-80" />
          <p className="font-medium">Coming Soon</p>
          <p className="text-sm text-muted-foreground">
            Calendar subscription links are under construction and will be available shortly.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
