import { X, Search, Zap, ZapOff } from 'lucide-react';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Input } from './ui/input';
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
    searchQuery,
    advancedMode,
    perClubEventTypes,
    setSelectedClubs,
    setSelectedEventTypes,
    setSearchQuery,
    setAdvancedMode,
    setPerClubEventTypes,
  } = useApp();

  const unions = clubs.filter(c => c.orgType === 'union');
  const departments = clubs.filter(c => c.orgType === 'department');

  // ── Advanced mode helpers ──────────────────────────────────────────────────
  const handleToggleAdvanced = () => {
    if (!advancedMode) {
      const init: Record<string, string[]> = {};
      clubs.forEach(c => { init[c.id] = [...selectedEventTypes]; });
      setPerClubEventTypes(init);
    }
    setAdvancedMode(!advancedMode);
  };

  const getClubTypes = (clubId: string) =>
    perClubEventTypes[clubId] ?? [...eventTypeNames];

  const toggleClubType = (clubId: string, type: string) => {
    const current = getClubTypes(clubId);
    const next = current.includes(type)
      ? current.filter(t => t !== type)
      : [...current, type];
    setPerClubEventTypes({ ...perClubEventTypes, [clubId]: next });
  };

  const allClubTypesSelected = (clubId: string) =>
    eventTypeNames.every(t => getClubTypes(clubId).includes(t));

  const toggleAllClubTypes = (clubId: string) => {
    const next = allClubTypesSelected(clubId) ? [] : [...eventTypeNames];
    setPerClubEventTypes({ ...perClubEventTypes, [clubId]: next });
  };

  // ── Global event type helpers ──────────────────────────────────────────────
  const allTypesSelected = eventTypeNames.every(t => selectedEventTypes.includes(t));
  const toggleType = (type: string) =>
    setSelectedEventTypes(
      selectedEventTypes.includes(type)
        ? selectedEventTypes.filter(t => t !== type)
        : [...selectedEventTypes, type]
    );

  // ── Club helpers ───────────────────────────────────────────────────────────
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
    searchQuery.trim() !== '' ||
    selectedClubs.length < clubs.length ||
    (!advancedMode && selectedEventTypes.length < eventTypeNames.length) ||
    (advancedMode && clubs.some(c => !allClubTypesSelected(c.id)));

  const renderClubList = (clubList: typeof clubs) => (
    <div className="space-y-1">
      {clubList.map(club => (
        <div key={club.id}>
          <div className="flex items-center space-x-2 py-1">
            <Checkbox
              id={`club-${club.id}`}
              checked={selectedClubs.includes(club.id)}
              onCheckedChange={() => toggleClub(club.id)}
            />
            <Label
              htmlFor={`club-${club.id}`}
              className="flex items-center gap-2 cursor-pointer text-sm font-normal flex-1"
            >
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: club.color }} />
              {club.name}
            </Label>
          </div>

          {advancedMode && selectedClubs.includes(club.id) && (
            <div className="ml-7 mb-2 space-y-1 border-l border-border pl-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Event types</span>
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => toggleAllClubTypes(club.id)}
                >
                  {allClubTypesSelected(club.id) ? 'Deselect all' : 'Select all'}
                </button>
              </div>
              {eventTypeNames.map(type => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`type-${club.id}-${type}`}
                    checked={getClubTypes(club.id).includes(type)}
                    onCheckedChange={() => toggleClubType(club.id, type)}
                  />
                  <Label htmlFor={`type-${club.id}-${type}`} className="cursor-pointer text-xs font-normal">
                    {type}
                  </Label>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Single scrollable container — no inner flex split */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-screen w-72 bg-sidebar border-r border-sidebar-border z-50 lg:z-0
          overflow-y-auto overscroll-contain
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Header */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-sidebar-border sticky top-0 bg-sidebar z-10">
          <h2 className="text-sm font-semibold">Filters</h2>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              title={advancedMode ? 'Disable advanced mode' : 'Enable advanced mode (per-club event types)'}
              onClick={handleToggleAdvanced}
            >
              {advancedMode
                ? <Zap className="h-4 w-4 text-primary" />
                : <ZapOff className="h-4 w-4 text-muted-foreground" />}
            </Button>
            <Button variant="ghost" size="icon" className="lg:hidden h-7 w-7" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-sidebar-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search events…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
          {advancedMode && (
            <p className="text-xs text-primary mt-2 flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Advanced: per-club event types active
            </p>
          )}
        </div>

        {/* Filter accordions */}
        <Accordion
          type="multiple"
          defaultValue={['event-types']}
          className="px-2"
        >
          {!advancedMode && (
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
          )}

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
              {renderClubList(unions)}
            </AccordionContent>
          </AccordionItem>

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
                {renderClubList(departments)}
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>

        {/* Reset filters — scrolls with content */}
        {hasActiveFilters && (
          <div className="px-4 py-4 border-t border-sidebar-border mt-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setSearchQuery('');
                setSelectedClubs(clubs.map(c => c.id));
                setSelectedEventTypes([...eventTypeNames]);
                setPerClubEventTypes({});
              }}
            >
              Reset Filters
            </Button>
          </div>
        )}
      </aside>
    </>
  );
}
