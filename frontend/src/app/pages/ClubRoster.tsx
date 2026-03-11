/// <reference types="vite/client" />
/**
 * @file ClubRoster.tsx
 * @description Public directory of all MCC clubs and departments. Route: /clubs
 *
 * ## Sections
 * - Search bar + org-type filter (All / Unions / Departments)
 * - Club cards: logo, name, orgType badge, description, social link buttons
 *   - Click → navigates to /club/:id
 * - Admin: "Add Club" button → opens dialog (POST /clubs → `addClub`)
 * - ICS export: download all events as .ics file (GET /events/ics with no filters)
 *
 * ## Data
 * Reads `clubs` from AppContext (populated by useClubs hook).
 * Filters are local state — no impact on the global dashboard filter.
 */
import { Users, ExternalLink, Plus, Download, Search, Building2 } from 'lucide-react';
import { ErrorState } from '../components/ErrorState';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://api.uomcc.org';

type Section = 'exec' | 'board' | 'intern';
const SECTION_LABELS: Record<Section, string> = { exec: 'Executive Team', board: 'Board', intern: 'Interns' };
const ALL_SECTIONS: Section[] = ['exec', 'board', 'intern'];

export function ClubRoster() {
  const { clubs, currentUser, addClub, error } = useApp();
  const navigate = useNavigate();
  const [isAddClubOpen, setIsAddClubOpen] = useState(false);

  // Download CSV state
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [selectedClubIds, setSelectedClubIds] = useState<Set<string>>(new Set());
  const [includeClubInfo, setIncludeClubInfo] = useState(true);
  const [includeSections, setIncludeSections] = useState<Set<Section>>(new Set(ALL_SECTIONS));
  const [downloading, setDownloading] = useState(false);

  const openDownload = () => {
    setSelectedClubIds(new Set(clubs.map(c => c.id)));
    setIncludeClubInfo(true);
    setIncludeSections(new Set(ALL_SECTIONS));
    setIsDownloadOpen(true);
  };

  const toggleClub = (id: string) =>
    setSelectedClubIds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const toggleSection = (sec: Section) =>
    setIncludeSections(prev => { const s = new Set(prev); s.has(sec) ? s.delete(sec) : s.add(sec); return s; });

  const handleDownload = async () => {
    if (selectedClubIds.size === 0) { toast.error('Select at least one club'); return; }
    if (!includeClubInfo && includeSections.size === 0) { toast.error('Select at least one type of data to include'); return; }

    setDownloading(true);
    // Wrap a value in quotes, escaping internal quotes
    const esc = (v: string | null | undefined) => `"${(v ?? '').replace(/"/g, '""')}"`;

    const selectedClubs = clubs.filter(c => selectedClubIds.has(c.id));

    // Fetch members for all selected clubs in parallel (only if at least one section is selected)
    type RawMember = { section: Section; name: string; title: string; email: string | null };
    const membersByClub = new Map<string, RawMember[]>();
    if (includeSections.size > 0) {
      await Promise.all(
        selectedClubs.map(async c => {
          try {
            const res = await fetch(`${API_BASE}/clubs/${c.id}/members`);
            if (res.ok) membersByClub.set(c.id, await res.json());
          } catch { /* skip */ }
        })
      );
    }

    // Build header row dynamically
    const headers: string[] = ['Org Name'];
    if (includeClubInfo) headers.push('Contact Email', 'Type', 'Collab Code', 'Description', 'Instagram', 'Linktree', 'Engage');
    for (const sec of ALL_SECTIONS) {
      if (includeSections.has(sec)) headers.push(SECTION_LABELS[sec]);
    }

    const rows: string[] = [headers.join(',')];

    // One row per club
    for (const c of selectedClubs) {
      const cells: string[] = [esc(c.name)];

      if (includeClubInfo) {
        cells.push(
          esc(c.adminEmail),
          esc(c.orgType === 'department' ? 'Department' : 'Union'),
          esc(c.collabCode),
          esc(c.description),
          esc(c.instagram),
          esc(c.linktree),
          esc(c.engage),
        );
      }

      for (const sec of ALL_SECTIONS) {
        if (!includeSections.has(sec)) continue;
        const members = (membersByClub.get(c.id) ?? []).filter(m => m.section === sec);
        // Each member on its own line within the cell: "Name — Title — email"
        const cell = members.map(m => [m.name, m.title, m.email].filter(Boolean).join(' — ')).join('\n');
        cells.push(esc(cell));
      }

      rows.push(cells.join(','));
    }

    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mcc_clubs_info.csv';
    a.click();
    URL.revokeObjectURL(url);
    setDownloading(false);
    setIsDownloadOpen(false);
  };

  const [search, setSearch] = useState('');
  const [showUnions, setShowUnions] = useState(true);
  const [showDepartments, setShowDepartments] = useState(true);

  // MCC itself should always be visible even when filtered
  const isMccOrg = (name: string) => {
    const n = name.toLowerCase();
    return n === 'mcc' || n.includes('multicultural center');
  };

  const filteredClubs = clubs.filter(club => {
    if (!isMccOrg(club.name)) {
      if (club.orgType === 'department' && !showDepartments) return false;
      if (club.orgType !== 'department' && !showUnions) return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      return club.name.toLowerCase().includes(q) || (club.description ?? '').toLowerCase().includes(q) || (club.collabCode ?? '').toLowerCase().includes(q);
    }
    return true;
  });

  const canAddClub = currentUser?.role === 'admin';

  const handleAddClub = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const clubId = formData.get('clubId') as string;
    const clubName = formData.get('clubName') as string;
    const description = formData.get('description') as string;
    const color = formData.get('color') as string;
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    // In a real app, you would store credentials securely
    const newClub = {
      id: clubId.toLowerCase().replace(/\s+/g, '-'),
      name: clubName,
      color: color || '#' + Math.floor(Math.random() * 16777215).toString(16),
      description,
      orgType: 'union' as const,
    };

    addClub(newClub);
    toast.success(`Club "${clubName}" added successfully. Username: ${username}`);
    setIsAddClubOpen(false);
  };

  if (error) {
    return <ErrorState title="Failed to load organizations" message={error} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl mb-1">Organization Roster</h2>
          <p className="text-muted-foreground">
            Explore all student organizations in the Multicultural Center
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={openDownload} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download CSV
          </Button>
          {canAddClub && (
            <Button onClick={() => setIsAddClubOpen(true)} className="bg-primary">
              <Plus className="h-4 w-4 mr-2" />
              Add Club
            </Button>
          )}
        </div>
      </div>

      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search organizations…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant={showUnions ? 'default' : 'outline'}
            onClick={() => setShowUnions(v => !v)}
            className="flex-1 sm:flex-none"
          >
            <Users className="h-4 w-4 mr-2" />
            {showUnions ? 'Clubs: On' : 'Clubs: Off'}
          </Button>
          <Button
            variant={showDepartments ? 'default' : 'outline'}
            onClick={() => setShowDepartments(v => !v)}
            className="flex-1 sm:flex-none"
          >
            <Building2 className="h-4 w-4 mr-2" />
            {showDepartments ? 'Departments: On' : 'Departments: Off'}
          </Button>
        </div>
      </div>

      {filteredClubs.length === 0 && (
        <p className="text-center text-muted-foreground py-12">
          No organizations match your search.
        </p>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClubs.map((club) => (
          <Card
            key={club.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(`/club/${club.id}`)}
          >
            <CardHeader>
              <div className="flex items-start gap-4">
                <div
                  className="w-16 h-16 rounded-lg flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: club.color }}
                >
                  {club.logo ? (
                    <ImageWithFallback
                      src={club.logo}
                      alt={`${club.name} logo`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <span className="text-2xl">{club.name.substring(0, 2)}</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CardTitle className="text-lg">{club.name}</CardTitle>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {club.orgType === 'department' ? 'Department' : 'Union'}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {club.description || 'Student organization'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>View details</span>
                <ExternalLink className="h-3 w-3 ml-auto" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Download CSV Modal */}
      <Dialog open={isDownloadOpen} onOpenChange={setIsDownloadOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Download Club Info CSV</DialogTitle>
            <DialogDescription>
              Select which clubs and data to include in the export.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Club selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">Clubs</Label>
                <div className="flex gap-3 text-xs">
                  <button type="button" className="text-primary underline underline-offset-2" onClick={() => setSelectedClubIds(new Set(clubs.map(c => c.id)))}>Select all</button>
                  <button type="button" className="text-muted-foreground underline underline-offset-2" onClick={() => setSelectedClubIds(new Set())}>Deselect all</button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-52 overflow-y-auto pr-1">
                {clubs.map(c => (
                  <label key={c.id} className="flex items-center gap-2 cursor-pointer select-none text-sm py-0.5">
                    <Checkbox
                      checked={selectedClubIds.has(c.id)}
                      onCheckedChange={() => toggleClub(c.id)}
                    />
                    <span className="truncate">{c.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Data to include */}
            <div>
              <Label className="text-sm font-medium block mb-2">Data to include</Label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
                  <Checkbox checked={includeClubInfo} onCheckedChange={v => setIncludeClubInfo(!!v)} />
                  Club info (name, type, description, links)
                </label>
                <div>
                  <p className="text-sm mb-1.5">Team members by section:</p>
                  <div className="pl-4 space-y-1.5">
                    {ALL_SECTIONS.map(sec => (
                      <label key={sec} className="flex items-center gap-2 cursor-pointer select-none text-sm">
                        <Checkbox checked={includeSections.has(sec)} onCheckedChange={() => toggleSection(sec)} />
                        {SECTION_LABELS[sec]}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" onClick={() => setIsDownloadOpen(false)}>Cancel</Button>
            <Button type="button" onClick={handleDownload} disabled={downloading} className="bg-primary">
              <Download className="h-4 w-4 mr-2" />
              {downloading ? 'Downloading…' : 'Download CSV'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Club Modal */}
      <Dialog open={isAddClubOpen} onOpenChange={setIsAddClubOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Club</DialogTitle>
            <DialogDescription>
              Create a new club and assign login credentials
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddClub} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clubId">Club ID</Label>
                <Input
                  id="clubId"
                  name="clubId"
                  placeholder="e.g., nsu"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">Lowercase, no spaces</p>
              </div>
              <div>
                <Label htmlFor="clubName">Club Name</Label>
                <Input
                  id="clubName"
                  name="clubName"
                  placeholder="e.g., NSU"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Brief description of the club"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="color">Brand Color</Label>
              <Input
                id="color"
                name="color"
                type="color"
                defaultValue="#7D9E8E"
              />
            </div>
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3">Club Admin Credentials</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">Username/Email</Label>
                  <Input
                    id="username"
                    name="username"
                    type="email"
                    placeholder="clubname@uoregon.edu"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="text"
                    placeholder="Assign a password"
                    required
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                These credentials will be shared with the club admin. Only upper admin can create or modify credentials.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddClubOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary">
                Add Club
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}