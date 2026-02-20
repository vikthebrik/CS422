import { Calendar, Filter } from 'lucide-react';
import { Button } from './ui/button';
import { useApp } from '../context/AppContext';

export function EmptyState() {
  const { selectedClubs, setSelectedClubs, clubs } = useApp();

  const selectAllClubs = () => {
    setSelectedClubs(clubs.map(c => c.id));
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 bg-card rounded-lg border border-border">
      <div className="bg-muted rounded-full p-6 mb-4">
        <Calendar className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-xl mb-2">No Events to Display</h3>
      {selectedClubs.length === 0 ? (
        <>
          <p className="text-muted-foreground text-center mb-4 max-w-md">
            Select clubs from the sidebar filters to see their upcoming events on the calendar.
          </p>
          <Button onClick={selectAllClubs} className="bg-primary">
            <Filter className="h-4 w-4 mr-2" />
            Show All Clubs
          </Button>
        </>
      ) : (
        <p className="text-muted-foreground text-center max-w-md">
          No events match your current filters. Try adjusting your club or event type selections.
        </p>
      )}
    </div>
  );
}
