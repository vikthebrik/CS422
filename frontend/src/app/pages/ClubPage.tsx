/**
 * @file ClubPage.tsx
 * @description Full detail page for a single club/organization. Route: /club/:clubId
 *
 * ## Sections
 * - **Club Header**: logo, name, orgType badge, description, social links, admin email
 * - **Events**: upcoming + past event list with local search + type filter. Admins/officers
 *   see an "Add Event" button (POST /events → `addEvent` in AppContext).
 * - **Our Team**: `OurTeam` component — public read, auth-gated CRUD for members
 * - **Edit Modal** (canEdit only): PATCH /clubs/:id — updates description, social links,
 *   ICS URL, name (admin only), logo (via `LogoUpload`). Calls `updateClub` on success.
 * - **Create Event Modal**: shared between ClubPage and ClubManagement; sets `clubId`
 *   to the current club by default.
 *
 * ## Auth / Permission
 * `canEdit = currentUser.role === 'admin' || currentUser.clubId === clubId`
 * Root admin can edit any club; club_admin can edit only their own.
 *
 * ## Key API Calls
 * | Action         | Endpoint                  | Context mutation |
 * |----------------|---------------------------|-----------------|
 * | Save club info | PATCH /clubs/:id          | updateClub()    |
 * | Create event   | POST /events              | addEvent()      |
 * | Change email   | PATCH /admin/clubs/:id/email | updateClub()  |
 */
import { useParams, useNavigate } from 'react-router';
import { Instagram, Link as LinkIcon, Globe, Calendar, MapPin, Clock, Pencil, Search, ChevronDown, ChevronUp, Ticket, Plus, AlertTriangle, Mail, Copy, Check, X, Download, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useApp } from '../context/AppContext';
import { getUpcomingClubEvents, getPastClubEvents } from '../constants';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { LogoUpload } from '../components/LogoUpload';
import { OurTeam } from '../components/OurTeam';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { Event, MeetingScheduleEntry } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://api.uomcc.org';

export function ClubPage() {
  const { clubId } = useParams();
  const { clubs, events, currentUser, authToken, updateClub, addEvent, eventTypeNames, loading } = useApp();
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [showPast, setShowPast] = useState(false);

  // Create event state
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [createEventType, setCreateEventType] = useState('');
  const [createClubId, setCreateClubId] = useState('');
  const [createRequiresRsvp, setCreateRequiresRsvp] = useState(false);
  const [createRsvpLink, setCreateRsvpLink] = useState('');
  const [createRsvpNote, setCreateRsvpNote] = useState('');
  const [defaultStart, setDefaultStart] = useState('');
  const [defaultEnd, setDefaultEnd] = useState('');

  const club = clubs.find(c => c.id === clubId);
  const canEdit = currentUser && (currentUser.role === 'admin' || currentUser.clubId === clubId);

  // Meeting schedule state
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduleRows, setScheduleRows] = useState<MeetingScheduleEntry[]>([]);
  const [savingSchedule, setSavingSchedule] = useState(false);

  // My page link copy state
  const [pageLinkCopied, setPageLinkCopied] = useState(false);

  // Email copy + edit state
  const [emailCopied, setEmailCopied] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);

  const copyEmail = () => {
    const email = club?.contactEmail || club?.adminEmail;
    if (!email) return;
    navigator.clipboard.writeText(email);
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
  };

  const saveEmail = async () => {
    if (!club || !emailInput.trim()) return;
    setSavingEmail(true);
    try {
      const res = await fetch(`${API_BASE}/clubs/${club.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ contactEmail: emailInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'Failed to update email'); return; }
      updateClub(club.id, { contactEmail: emailInput.trim() });
      setEditingEmail(false);
    } catch {
      toast.error('Could not reach the server');
    } finally {
      setSavingEmail(false);
    }
  };

  const openScheduleEdit = () => {
    setScheduleRows(club?.meetingSchedule ? [...club.meetingSchedule] : [{ day: '', time: '', location: '', notes: '' }]);
    setIsScheduleOpen(true);
  };

  const saveSchedule = async () => {
    if (!club) return;
    const cleaned = scheduleRows.filter(r => r.day.trim() || r.time.trim() || r.location.trim());
    setSavingSchedule(true);
    try {
      const res = await fetch(`${API_BASE}/clubs/${club.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ meetingSchedule: cleaned }),
      });
      if (!res.ok) { const d = await res.json(); toast.error(d.error ?? 'Failed to save'); return; }
      updateClub(club.id, { meetingSchedule: cleaned });
      setIsScheduleOpen(false);
      toast.success('Meeting schedule saved');
    } catch {
      toast.error('Could not reach the server');
    } finally {
      setSavingSchedule(false);
    }
  };

  const downloadScheduleCsv = () => {
    if (!club?.meetingSchedule?.length) return;
    const header = 'Day,Time,Location,Notes';
    const rows = club.meetingSchedule.map(r =>
      [r.day, r.time, r.location, r.notes ?? ''].map(v => `"${v.replace(/"/g, '""')}"`).join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${club.name.replace(/\s+/g, '_')}_meeting_schedule.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const allUpcoming = clubId ? getUpcomingClubEvents(events, clubId) : [];
  const allPast = clubId ? getPastClubEvents(events, clubId) : [];

  const filterEvents = (evts: Event[]) => {
    let result = evts;
    if (selectedType !== 'all') {
      result = result.filter(e => e.eventType === selectedType);
    }
    if (localSearch.trim()) {
      const q = localSearch.toLowerCase();
      result = result.filter(
        e => e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q)
      );
    }
    return result;
  };

  const upcomingEvents = useMemo(() => filterEvents(allUpcoming), [allUpcoming, selectedType, localSearch]);
  const pastEvents = useMemo(() => filterEvents(allPast), [allPast, selectedType, localSearch]);

  const openCreateEvent = () => {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    now.setHours(now.getHours() + 1);
    const end = new Date(now);
    end.setHours(end.getHours() + 1);
    const pad = (n: number) => String(n).padStart(2, '0');
    const toLocal = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setDefaultStart(toLocal(now));
    setDefaultEnd(toLocal(end));
    setCreateClubId(clubId ?? '');
    setCreateEventType('');
    setCreateRequiresRsvp(false);
    setCreateRsvpLink('');
    setCreateRsvpNote('');
    setIsCreateEventOpen(true);
  };

  const handleCreateEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const startVal = formData.get('startTime') as string;
    const endVal = formData.get('endTime') as string;
    if (!createClubId) return;

    try {
      const res = await fetch(`${API_BASE}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          title: formData.get('title') as string,
          description: formData.get('description') as string,
          location: formData.get('location') as string,
          eventType: createEventType || undefined,
          clubId: createClubId,
          startTime: new Date(startVal).toISOString(),
          endTime: new Date(endVal).toISOString(),
          rsvpLink: createRsvpLink || null,
          requiresRsvp: createRequiresRsvp,
          rsvpNote: createRsvpNote || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error((data as any).error ?? `Server error (${res.status})`); return; }

      const clubColor = clubs.find(c => c.id === data.club_id)?.color;
      addEvent({
        id: data.id,
        title: data.title,
        description: data.description ?? '',
        location: data.location ?? '',
        startTime: new Date(data.start_time),
        endTime: new Date(data.end_time),
        clubId: data.club_id,
        eventType: data.type ?? 'Other',
        color: clubColor,
        requiresRsvp: data.requires_rsvp ?? createRequiresRsvp,
        rsvpLink: data.rsvp_link ?? null,
        rsvpNote: data.rsvp_note ?? null,
      });
      toast.success('Event created');
      setIsCreateEventOpen(false);
    } catch {
      toast.error('Could not reach the server');
    }
  };

  if (!club) {
    if (loading) {
      return <div className="text-center py-12 text-muted-foreground">Loading…</div>;
    }
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl mb-2">Organization not found</h2>
        <Button onClick={() => navigate('/clubs')}>Back to Club Roster</Button>
      </div>
    );
  }

  const handleSaveClubInfo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const clubData: Record<string, string> = {
      description: formData.get('club-description') as string,
      instagram: formData.get('club-instagram') as string,
      linktree: formData.get('club-linktree') as string,
      engage: formData.get('club-engage') as string,
      contactEmail: formData.get('club-contact-email') as string,
      outlookLink: formData.get('club-ics-url') as string,
    };
    if (currentUser?.role === 'admin') {
      clubData.name = formData.get('club-name') as string;
    }

    try {
      const res = await fetch(`${API_BASE}/clubs/${club.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify(clubData),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error ?? 'Failed to update club');
        return;
      }
    } catch {
      toast.error('Could not reach the server');
      return;
    }

    updateClub(club.id, clubData);
    toast.success('Club information updated successfully');
    setIsEditModalOpen(false);
  };

  const renderEventCard = (event: Event) => (
    <button
      key={event.id}
      onClick={() => navigate(`/event/${event.id}`)}
      className="w-full text-left border border-border rounded-lg p-4 hover:bg-accent transition-colors"
    >
      <div className="flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-lg flex flex-col items-center justify-center text-white shrink-0"
          style={{ backgroundColor: club.color }}
        >
          <div className="text-xs">{format(event.startTime, 'MMM')}</div>
          <div className="text-lg leading-none">{format(event.startTime, 'd')}</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-medium">{event.title}</h4>
            <Badge variant="secondary" className="shrink-0">{event.eventType}</Badge>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {event.description}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(event.startTime, 'MMM d, yyyy')} · {format(event.startTime, 'h:mm a')} - {format(event.endTime, 'h:mm a')}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {event.location}
            </span>
            {event.requiresRsvp && event.rsvpLink && (
              <a
                href={event.rsvpLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90"
              >
                <Ticket className="h-3 w-3" />
                Tickets / RSVP — click here
              </a>
            )}
          </div>
        </div>
      </div>
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="outline" onClick={() => navigate('/clubs')}>
        ← Back to Club Roster
      </Button>

      {/* Club Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-6">
            <div
              className="w-24 h-24 rounded-lg flex items-center justify-center text-white shrink-0"
              style={{ backgroundColor: club.color }}
            >
              {club.logo ? (
                <ImageWithFallback
                  src={club.logo}
                  alt={`${club.name} logo`}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <span className="text-4xl">{club.name.substring(0, 2)}</span>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <CardTitle className="text-3xl">{club.name}</CardTitle>
                    <Badge variant="secondary">
                      {club.orgType === 'department' ? 'Department' : 'Union'}
                    </Badge>
                    {club.collabCode && (
                      <Badge variant="outline" className="font-mono text-xs text-muted-foreground">
                        collab: {club.collabCode}
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-base">
                    {club.description || 'Student organization at the University of Oregon'}
                  </CardDescription>
                </div>
                {canEdit && (
                  <Button onClick={() => setIsEditModalOpen(true)} variant="outline" size="sm">
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Organization Info
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Contact email — visible to all, editable by root */}
          {((club.contactEmail || club.adminEmail) || currentUser?.role === 'admin') && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              {editingEmail ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    className="flex-1 border border-border rounded px-2 py-1 text-sm font-mono"
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') saveEmail();
                      if (e.key === 'Escape') setEditingEmail(false);
                    }}
                    autoFocus
                    type="email"
                  />
                  <Button size="sm" onClick={saveEmail} disabled={savingEmail}>
                    {savingEmail ? 'Saving…' : 'Save'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingEmail(false)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {(club.contactEmail || club.adminEmail) ? (
                    <button
                      type="button"
                      onClick={copyEmail}
                      className="inline-flex items-center gap-1.5 text-sm font-mono hover:text-primary transition-colors"
                      title="Click to copy"
                    >
                      {club.contactEmail || club.adminEmail}
                      {emailCopied
                        ? <Check className="h-3.5 w-3.5 text-green-500" />
                        : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                    </button>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">No email set</span>
                  )}
                  {currentUser?.role === 'admin' && (
                    <button
                      type="button"
                      onClick={() => { setEmailInput(club.contactEmail ?? club.adminEmail ?? ''); setEditingEmail(true); }}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      title="Edit email"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {club.instagram && (
              <a
                href={club.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors"
              >
                <Instagram className="h-4 w-4" />
                <span className="text-sm">Instagram</span>
              </a>
            )}
            {club.linktree && (
              <a
                href={club.linktree}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors"
              >
                <LinkIcon className="h-4 w-4" />
                <span className="text-sm">Linktree</span>
              </a>
            )}
            {club.engage && (
              <a
                href={club.engage}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors"
              >
                <Globe className="h-4 w-4" />
                <span className="text-sm">Engage</span>
              </a>
            )}
          </div>

          {/* Meeting schedule inline — unions only */}
          {club.orgType !== 'department' && club.meetingSchedule && club.meetingSchedule.length > 0 && (
            <div className="border-t border-border pt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Meeting Schedule
                </span>
                {canEdit && (
                  <button
                    type="button"
                    onClick={openScheduleEdit}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {club.meetingSchedule.map((row, i) => (
                  <div key={i} className="inline-flex items-center gap-1.5 rounded-md bg-muted px-3 py-1.5 text-sm">
                    <span className="font-medium">{row.day}</span>
                    {row.time && <><span className="text-muted-foreground">·</span><span className="text-muted-foreground">{row.time}</span></>}
                    {row.location && <><span className="text-muted-foreground">·</span><span className="flex items-center gap-0.5 text-muted-foreground"><MapPin className="h-3 w-3" />{row.location}</span></>}
                  </div>
                ))}
              </div>
              {club.meetingSchedule.some(r => r.notes) && (
                <p className="text-xs text-muted-foreground mt-1.5">
                  {club.meetingSchedule.filter(r => r.notes).map(r => r.notes).join(' · ')}
                </p>
              )}
            </div>
          )}

          {/* My Page link — visible to club admins for sharing in linktrees/bios */}
          {canEdit && (
            <div className="border-t border-border pt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <ExternalLink className="h-3.5 w-3.5" />
                My Page Link
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-muted px-3 py-1.5 text-xs font-mono text-foreground truncate">
                  {window.location.origin}/club/{clubId}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/club/${clubId}`);
                    setPageLinkCopied(true);
                    setTimeout(() => setPageLinkCopied(false), 2000);
                  }}
                  className="shrink-0 flex items-center gap-1 text-xs px-3 py-1.5 rounded border border-border bg-background hover:bg-accent transition-colors"
                  title="Copy link"
                >
                  {pageLinkCopied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                  {pageLinkCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Share this link in your Linktree, bio, or anywhere to send students directly to your page.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Events */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle>Events</CardTitle>
              <CardDescription>Events hosted by {club.name}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {canEdit && (
                <Button size="sm" className="bg-primary" onClick={openCreateEvent}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Event
                </Button>
              )}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search…"
                  value={localSearch}
                  onChange={e => setLocalSearch(e.target.value)}
                  className="pl-8 h-8 text-sm w-40"
                />
              </div>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="h-8 text-sm w-36">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {eventTypeNames.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upcoming */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Upcoming</h4>
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Calendar className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No upcoming events{localSearch || selectedType !== 'all' ? ' matching filters' : ''}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map(renderEventCard)}
              </div>
            )}
          </div>

          {/* Past events toggle */}
          <div className="border-t pt-3">
            <button
              type="button"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowPast(v => !v)}
            >
              {showPast ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {showPast ? 'Hide past events' : `Show past events (${allPast.length})`}
            </button>

            {showPast && (
              <div className="mt-3 space-y-3">
                {pastEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No past events{localSearch || selectedType !== 'all' ? ' matching filters' : ''}
                  </p>
                ) : (
                  pastEvents.map(renderEventCard)
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Our Team */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Our Team</CardTitle>
              <CardDescription>Meet the people behind {club.name}</CardDescription>
            </div>
            {canEdit && (
              <Badge variant="outline" className="text-xs">
                Click a section's Add button to manage members
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <OurTeam
            clubId={club.id}
            canEdit={!!canEdit}
            authToken={authToken}
            orgType={club.orgType}
            sectionLabels={club.sectionLabels}
            onSectionLabelsChange={labels => updateClub(club.id, { sectionLabels: labels })}
          />
        </CardContent>
      </Card>

      {/* Meeting Schedule — full card for departments (or for admin editing on any org) */}
      {(club.orgType === 'department' ? (club.meetingSchedule?.length || canEdit) : canEdit) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Meeting Schedule</CardTitle>
                <CardDescription>Approximate recurring meeting times for {club.name}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {club.meetingSchedule?.length ? (
                  <Button variant="outline" size="sm" onClick={downloadScheduleCsv}>
                    <Download className="h-4 w-4 mr-1" />
                    Download CSV
                  </Button>
                ) : null}
                {canEdit && (
                  <Button variant="outline" size="sm" onClick={openScheduleEdit}>
                    <Pencil className="h-4 w-4 mr-1" />
                    {club.meetingSchedule?.length ? 'Edit' : 'Add Schedule'}
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!club.meetingSchedule?.length ? (
              <p className="text-sm text-muted-foreground">No meeting schedule set yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground w-28">Day</th>
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground w-36">Time</th>
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Location</th>
                      <th className="text-left py-2 font-medium text-muted-foreground">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {club.meetingSchedule.map((row, i) => (
                      <tr key={i}>
                        <td className="py-2 pr-4 font-medium">{row.day}</td>
                        <td className="py-2 pr-4 text-muted-foreground">{row.time}</td>
                        <td className="py-2 pr-4 flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                          {row.location}
                        </td>
                        <td className="py-2 text-muted-foreground text-xs">{row.notes ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Meeting Schedule Edit Dialog */}
      <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Meeting Schedule</DialogTitle>
            <DialogDescription>Add recurring meeting times. Students will see these on your club page.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {scheduleRows.map((row, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-start">
                <div>
                  {i === 0 && <Label className="text-xs mb-1 block">Day</Label>}
                  <Input
                    placeholder="e.g. Monday"
                    value={row.day}
                    onChange={e => setScheduleRows(rows => rows.map((r, j) => j === i ? { ...r, day: e.target.value } : r))}
                  />
                </div>
                <div>
                  {i === 0 && <Label className="text-xs mb-1 block">Time</Label>}
                  <Input
                    placeholder="e.g. 6:00–7:00 PM"
                    value={row.time}
                    onChange={e => setScheduleRows(rows => rows.map((r, j) => j === i ? { ...r, time: e.target.value } : r))}
                  />
                </div>
                <div>
                  {i === 0 && <Label className="text-xs mb-1 block">Location</Label>}
                  <Input
                    placeholder="e.g. EMU 204"
                    value={row.location}
                    onChange={e => setScheduleRows(rows => rows.map((r, j) => j === i ? { ...r, location: e.target.value } : r))}
                  />
                </div>
                <div className={i === 0 ? 'pt-5' : ''}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setScheduleRows(rows => rows.filter((_, j) => j !== i))}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
                <div className="col-span-3">
                  <Input
                    placeholder="Notes (optional) — e.g. Biweekly, members only"
                    value={row.notes ?? ''}
                    onChange={e => setScheduleRows(rows => rows.map((r, j) => j === i ? { ...r, notes: e.target.value } : r))}
                  />
                </div>
                <div />
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setScheduleRows(rows => [...rows, { day: '', time: '', location: '', notes: '' }])}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Row
            </Button>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsScheduleOpen(false)}>Cancel</Button>
            <Button type="button" className="bg-primary" onClick={saveSchedule} disabled={savingSchedule}>
              {savingSchedule ? 'Saving…' : 'Save Schedule'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Club Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Organization Information</DialogTitle>
            <DialogDescription>Update organization details, social media links, and calendar feed</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveClubInfo} className="space-y-4">
            {currentUser?.role === 'admin' && (
              <div>
                <Label htmlFor="club-name">Organization Name</Label>
                <Input id="club-name" name="club-name" defaultValue={club.name} required />
              </div>
            )}
            <div>
              <Label>Organization Logo</Label>
              <div className="mt-1">
                <LogoUpload
                  clubId={club.id}
                  currentLogo={club.logo}
                  clubColor={club.color}
                  clubInitials={club.name.substring(0, 2)}
                  authToken={authToken}
                  onUploaded={newUrl => updateClub(club.id, { logo: newUrl })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="club-description">Description</Label>
              <Textarea
                id="club-description"
                name="club-description"
                defaultValue={club.description}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="club-instagram">Instagram URL</Label>
                <Input id="club-instagram" name="club-instagram" defaultValue={club.instagram} placeholder="https://instagram.com/..." />
              </div>
              <div>
                <Label htmlFor="club-linktree">Linktree URL</Label>
                <Input id="club-linktree" name="club-linktree" defaultValue={club.linktree} placeholder="https://linktr.ee/..." />
              </div>
            </div>
            <div>
              <Label htmlFor="club-engage">Engage URL</Label>
              <Input id="club-engage" name="club-engage" defaultValue={club.engage} placeholder="https://engage.uoregon.edu/..." />
            </div>
            <div>
              <Label htmlFor="club-contact-email">Contact Email</Label>
              <Input id="club-contact-email" name="club-contact-email" type="email" defaultValue={club.contactEmail ?? club.adminEmail} placeholder="contact@uoregon.edu" />
              <p className="text-xs text-muted-foreground mt-1">
                Public contact email shown on the club page. Useful when the admin login email differs from the club's public address.
              </p>
            </div>
            <div>
              <Label htmlFor="club-ics-url">Outlook Calendar ICS URL</Label>
              <Input
                id="club-ics-url"
                name="club-ics-url"
                defaultValue={club.outlookLink}
                placeholder="https://outlook.office365.com/owa/calendar/..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                Paste your Outlook shared calendar ICS link here. Events will sync automatically.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary">
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Event Dialog */}
      <Dialog open={isCreateEventOpen} onOpenChange={setIsCreateEventOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Event</DialogTitle>
            <DialogDescription>Add a new event to the calendar</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateEvent} className="space-y-4">
            <div>
              <Label htmlFor="ce-title">Event Title</Label>
              <Input id="ce-title" name="title" required className="mt-1" />
            </div>
            <div>
              <Label htmlFor="ce-description">Description</Label>
              <Textarea id="ce-description" name="description" rows={3} className="mt-1" />
            </div>
            <div className={`grid gap-4 ${currentUser?.role === 'admin' ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {currentUser?.role === 'admin' && (
                <div>
                  <Label>Organization</Label>
                  <Select value={createClubId} onValueChange={setCreateClubId}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select organization…" />
                    </SelectTrigger>
                    <SelectContent>
                      {clubs.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <Label>Event Type</Label>
                <Select value={createEventType} onValueChange={setCreateEventType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select type…" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypeNames.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ce-start">Start Date & Time</Label>
                <Input id="ce-start" name="startTime" type="datetime-local" defaultValue={defaultStart} required className="mt-1" />
              </div>
              <div>
                <Label htmlFor="ce-end">End Date & Time</Label>
                <Input id="ce-end" name="endTime" type="datetime-local" defaultValue={defaultEnd} required className="mt-1" />
              </div>
            </div>
            <div>
              <Label htmlFor="ce-location">Location</Label>
              <Input id="ce-location" name="location" required className="mt-1" />
            </div>
            {/* RSVP Section */}
            <div className="space-y-3 rounded-lg border border-border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">RSVP Required</Label>
                  <p className="text-xs text-muted-foreground">Toggle if attendees must RSVP for this event</p>
                </div>
                <Switch checked={createRequiresRsvp} onCheckedChange={setCreateRequiresRsvp} />
              </div>
              {createRequiresRsvp && (
                <>
                  <div>
                    <Label htmlFor="ce-rsvpLink">RSVP / Ticket Link</Label>
                    <Input
                      id="ce-rsvpLink"
                      value={createRsvpLink}
                      onChange={e => setCreateRsvpLink(e.target.value)}
                      placeholder="https://..."
                      className="mt-1"
                    />
                    {!createRsvpLink && (
                      <div className="flex items-center gap-1.5 mt-1.5 text-amber-600 dark:text-amber-400 text-xs">
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        <span>Add an RSVP link so attendees can register</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="ce-rsvpNote">RSVP Note</Label>
                    <Textarea
                      id="ce-rsvpNote"
                      value={createRsvpNote}
                      onChange={e => setCreateRsvpNote(e.target.value)}
                      placeholder="e.g. Please RSVP by Friday noon. Limited seating available."
                      rows={2}
                      className="mt-1"
                    />
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateEventOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary" disabled={!createClubId}>
                <Calendar className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
