import { X } from 'lucide-react';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { useApp } from '../context/AppContext';
import { EVENT_TYPES } from '../types';

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FilterSidebar({ isOpen, onClose }: FilterSidebarProps) {
  const { clubs, selectedClubs, selectedEventTypes, setSelectedClubs, setSelectedEventTypes } = useApp();

  const toggleClub = (clubId: string) => {
    setSelectedClubs(
      selectedClubs.includes(clubId)
        ? selectedClubs.filter(id => id !== clubId)
        : [...selectedClubs, clubId]
    );
  };

  const toggleEventType = (type: string) => {
    setSelectedEventTypes(
      selectedEventTypes.includes(type)
        ? selectedEventTypes.filter(t => t !== type)
        : [...selectedEventTypes, type]
    );
  };

  const clearFilters = () => {
    setSelectedClubs([]);
    setSelectedEventTypes([]);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-screen w-72 bg-sidebar border-r border-sidebar-border z-50 lg:z-0
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 flex items-center justify-between border-b border-sidebar-border">
            <h2>Filters</h2>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
              {/* Club Filters */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm">Clubs</h3>
                  <div className="flex gap-2">
                    {selectedClubs.length === clubs.length ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => setSelectedClubs([])}
                      >
                        Deselect All
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => setSelectedClubs(clubs.map(c => c.id))}
                      >
                        Select All
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  {clubs.map((club) => (
                    <div key={club.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`club-${club.id}`}
                        checked={selectedClubs.includes(club.id)}
                        onCheckedChange={() => toggleClub(club.id)}
                      />
                      <Label
                        htmlFor={`club-${club.id}`}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: club.color }}
                        />
                        {club.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Event Type Filters */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm">Event Types</h3>
                  <div className="flex gap-2">
                    {selectedEventTypes.length === EVENT_TYPES.length ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => setSelectedEventTypes([])}
                      >
                        Deselect All
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => setSelectedEventTypes([...EVENT_TYPES])}
                      >
                        Select All
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  {EVENT_TYPES.map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={`type-${type}`}
                        checked={selectedEventTypes.includes(type)}
                        onCheckedChange={() => toggleEventType(type)}
                      />
                      <Label
                        htmlFor={`type-${type}`}
                        className="cursor-pointer"
                      >
                        {type}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* Footer */}
          {(selectedClubs.length > 0 || selectedEventTypes.length > 0) && (
            <div className="p-4 border-t border-sidebar-border">
              <Button
                variant="outline"
                className="w-full"
                onClick={clearFilters}
              >
                Clear All Filters
              </Button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}