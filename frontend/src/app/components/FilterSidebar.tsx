import { X } from 'lucide-react';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './ui/accordion';
import { useApp } from '../context/AppContext';

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FilterSidebar({ isOpen, onClose }: FilterSidebarProps) {
  const {
    clubs,
    selectedClubs,
    selectedEventTypes,
    eventTypeNames,
    setSelectedClubs,
    setSelectedEventTypes,
  } = useApp();

  const unions = clubs.filter(c => c.orgType === 'union');
  const departments = clubs.filter(c => c.orgType === 'department');

  // ── Event type helpers ────────────────────────────────────────────────────
  const allTypesSelected = eventTypeNames.every(t => selectedEventTypes.includes(t));
  const toggleType = (type: string) =>
    setSelectedEventTypes(
      selectedEventTypes.includes(type)
        ? selectedEventTypes.filter(t => t !== type)
        : [...selectedEventTypes, type]
    );

  // ── Club helpers (shared for unions + departments) ────────────────────────
  const allSelected = (ids: string[]) => ids.every(id => selectedClubs.includes(id));
  const toggleClub = (id: string) =>
    setSelectedClubs(
      selectedClubs.includes(id)
        ? selectedClubs.filter(c => c !== id)
        : [...selectedClubs, id]
    );
  const selectGroup = (ids: string[]) =>
    setSelectedClubs([...new Set([...selectedClubs, ...ids])]);
  const deselectGroup = (ids: string[]) =>
    setSelectedClubs(selectedClubs.filter(id => !ids.includes(id)));

  const hasActiveFilters =
    selectedClubs.length < clubs.length ||
    selectedEventTypes.length < eventTypeNames.length;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

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
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <Accordion
              type="multiple"
              defaultValue={['event-types']}
              className="px-2"
            >
              {/* ── Event Types (open by default) ─────────────────────────── */}
              <AccordionItem value="event-types">
                <AccordionTrigger className="px-2 hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-2">
                    <span className="text-sm font-medium">Event Types</span>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground"
                      onClick={e => {
                        e.stopPropagation();
                        allTypesSelected
                          ? setSelectedEventTypes([])
                          : setSelectedEventTypes([...eventTypeNames]);
                      }}
                    >
                      {allTypesSelected ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-2">
                  <div className="space-y-2">
                    {eventTypeNames.map(type => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={`type-${type}`}
                          checked={selectedEventTypes.includes(type)}
                          onCheckedChange={() => toggleType(type)}
                        />
                        <Label htmlFor={`type-${type}`} className="cursor-pointer text-sm font-normal">
                          {type}
                        </Label>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* ── Unions (collapsed by default) ─────────────────────────── */}
              <AccordionItem value="unions">
                <AccordionTrigger className="px-2 hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-2">
                    <span className="text-sm font-medium">Unions</span>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground"
                      onClick={e => {
                        e.stopPropagation();
                        const ids = unions.map(c => c.id);
                        allSelected(ids) ? deselectGroup(ids) : selectGroup(ids);
                      }}
                    >
                      {allSelected(unions.map(c => c.id)) ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-2">
                  <div className="space-y-2">
                    {unions.map(club => (
                      <div key={club.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`club-${club.id}`}
                          checked={selectedClubs.includes(club.id)}
                          onCheckedChange={() => toggleClub(club.id)}
                        />
                        <Label
                          htmlFor={`club-${club.id}`}
                          className="flex items-center gap-2 cursor-pointer text-sm font-normal"
                        >
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: club.color }} />
                          {club.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* ── Departments (collapsed by default) ────────────────────── */}
              {departments.length > 0 && (
                <AccordionItem value="departments">
                  <AccordionTrigger className="px-2 hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-2">
                      <span className="text-sm font-medium">Departments</span>
                      <button
                        type="button"
                        className="text-xs text-muted-foreground hover:text-foreground"
                        onClick={e => {
                          e.stopPropagation();
                          const ids = departments.map(c => c.id);
                          allSelected(ids) ? deselectGroup(ids) : selectGroup(ids);
                        }}
                      >
                        {allSelected(departments.map(c => c.id)) ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-2">
                    <div className="space-y-2">
                      {departments.map(club => (
                        <div key={club.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`club-${club.id}`}
                            checked={selectedClubs.includes(club.id)}
                            onCheckedChange={() => toggleClub(club.id)}
                          />
                          <Label
                            htmlFor={`club-${club.id}`}
                            className="flex items-center gap-2 cursor-pointer text-sm font-normal"
                          >
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: club.color }} />
                            {club.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </ScrollArea>

          {/* Footer — clear all */}
          {hasActiveFilters && (
            <div className="p-4 border-t border-sidebar-border">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSelectedClubs(clubs.map(c => c.id));
                  setSelectedEventTypes([...eventTypeNames]);
                }}
              >
                Reset Filters
              </Button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
