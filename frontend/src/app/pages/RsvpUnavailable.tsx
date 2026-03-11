import { Link, useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';

export function RsvpUnavailable() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-6 text-center">
      <img
        src="/assets/Sitting.png"
        alt="Duck sitting and waiting"
        className="h-40 w-40 object-contain mb-6"
        style={{ imageRendering: 'pixelated' }}
      />

      <h1 className="text-2xl font-semibold mb-2">No link attached yet.</h1>
      <p className="text-muted-foreground mb-8 max-w-sm">
        The organizer hasn't added an RSVP or ticket link for this event yet. Check back later!
      </p>

      <Button variant="outline" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Go back
      </Button>
    </div>
  );
}
