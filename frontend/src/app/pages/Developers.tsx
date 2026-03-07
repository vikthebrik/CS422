/**
 * @file Developers.tsx
 * @description Public developer reference + how-to page. Route: /developers
 *
 * Sections:
 *  1. Project info — CS422 Winter 2026, team, repo, API
 *  2. Team cards — developer bios
 *  3. System architecture diagram
 *  4. How to use the site (visitors + club officers)
 *  5. How to sync Outlook (club officer guide)
 *  6. API reference summary
 */

import { ExternalLink, Github, Server, BookOpen, Calendar, RefreshCw, Mail, Tag, FolderOpen, Ticket, CheckCircle } from 'lucide-react';

const GITHUB_REPO = 'https://github.com/vikthebrik/CS422';
const API_BASE_URL = 'https://api.uomcc.org';

const DEVELOPERS = [
  {
    name: 'Vikram',
    role: 'Lead Full-Stack Developer',
    email: '',
    github: 'https://github.com/vikthebrik',
    bio: 'Led end-to-end architecture design, Express REST API, ICS sync pipeline, Supabase auth & storage integration, and full frontend build.',
  },
  {
    name: 'Maddie',
    role: 'Frontend Developer & UI Design',
    email: '',
    github: 'https://github.com/madelineluu',
    bio: 'Contributed to frontend component design, UI/UX layout decisions, and user-facing feature development across the React SPA.',
  },
  {
    name: 'Rayna',
    role: 'Frontend Developer & QA',
    email: '',
    github: 'https://github.com/raynapatel',
    bio: 'Contributed to frontend development, cross-browser testing, and ensuring a consistent user experience across the application.',
  },
  {
    name: 'Eirann',
    role: 'Frontend Developer & Documentation',
    email: '',
    github: 'https://github.com/EireannCoelho',
    bio: 'Contributed to frontend development, project documentation, and design system consistency throughout the application.',
  },
];

const TECH_STACK = [
  { label: 'Frontend', value: 'React 18 · TypeScript · Vite · Tailwind CSS' },
  { label: 'Backend', value: 'Node.js · Express · TypeScript' },
  { label: 'Database', value: 'Supabase (PostgreSQL) · Supabase Auth · Supabase Storage' },
  { label: 'Email', value: 'Resend SDK (HTTP/443)' },
  { label: 'DNS / CDN', value: 'Cloudflare (DNS proxy, SSL/TLS, DDoS)' },
  { label: 'Hosting', value: 'Vercel (frontend) · Render (backend)' },
  { label: 'Calendar', value: 'Outlook ICS feeds · iCalendar spec (node-ical)' },
];

const USE_STEPS = [
  {
    step: '1',
    title: 'Browse the calendar',
    desc: 'Visit the Dashboard to see all upcoming MCC events. Switch between the calendar grid and list views with the toggle in the top-right of the content area.',
  },
  {
    step: '2',
    title: 'Filter by club or event type',
    desc: 'Use the Filter Sidebar on the left to show only events from specific organizations or of specific types (Events, Meetings, Office Hours, etc.). Enable Advanced Mode for per-club type filtering.',
  },
  {
    step: '3',
    title: 'View event details',
    desc: 'Click any event tile to open a detail modal showing the full description, location, RSVP info, and collaborating clubs. Click "View Full Page" for the dedicated event page.',
  },
  {
    step: '4',
    title: 'Explore organizations',
    desc: 'Visit Org Roster to browse all MCC clubs and departments. Each club page shows upcoming events, social links, and the team roster.',
  },
  {
    step: '5',
    title: 'Club officer login',
    desc: 'Officers can sign in with the "Admin Sign In" button to edit their club\'s events, manage RSVP settings, update club info, add team members, and handle collaboration requests.',
  },
];

// Written for club officers — self-service ICS management
const OUTLOOK_STEPS = [
  {
    step: '1',
    title: "Get your Outlook calendar's ICS feed URL",
    desc: "In Microsoft 365, open your club's group calendar → Settings → Shared calendars → Publish a calendar → set 'Can view all details' → copy the ICS link. It looks like: https://outlook.office365.com/owa/calendar/.../calendar.ics",
  },
  {
    step: '2',
    title: 'Paste the ICS link into your club profile',
    desc: "Log in as your club's officer → go to your club page → click 'Edit Organization Info' → paste the URL into the 'Outlook Calendar ICS URL' field → Save. Your events will start appearing on the site within 14 minutes.",
  },
  {
    step: '3',
    title: 'Update the link any time you need to',
    desc: "If your calendar URL ever changes (e.g. after a calendar refresh or org handoff), open the same edit modal on your club page and paste the new URL. You don't need to contact the MCC admin — you own this field.",
  },
  {
    step: '4',
    title: 'Add events in Outlook — they appear automatically',
    desc: "Create events in your club's Microsoft 365 group calendar in Outlook. The site fetches new events every 14 minutes automatically — no manual entry needed on the site.",
  },
  {
    step: '5',
    title: 'Tag event titles to control the event type',
    desc: "Start your Outlook event title with a short tag to control how it appears on the site. Without a tag it defaults to 'Other'. See the full tagging guide below.",
  },
  {
    step: '6',
    title: 'Mark ticket or RSVP events',
    desc: "Add [T] or [Ticket] to the start of the title, or include 'tickets', 'rsvp', or 'register' in the title or description. The site will automatically show an RSVP badge on that event.",
  },
  {
    step: '7',
    title: 'Editing events on the site vs. in Outlook',
    desc: "You can edit an event's title, description, location, or type directly on the site (log in → Event Page → Edit). After you do, that event is 'frozen' — future Outlook syncs won't overwrite your changes.\n\nTo hand control back to Outlook, click 'Resume Auto-Sync' on the amber banner at the top of the event page.",
  },
  {
    step: '8',
    title: 'Collaborating with other clubs',
    desc: 'Invite members of another MCC club to your Outlook event as attendees and the sync auto-creates a collaboration request for that club. Once they accept, their club badge appears on the event. You can also add/remove collaborators manually from the event page.',
  },
];

export function Developers() {
  return (
    <div className="space-y-12 pb-16">

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                CS 422 · Winter 2026
              </span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                University of Oregon
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight mt-2">MCC Calendar Hub</h1>
            <p className="text-muted-foreground mt-2 max-w-xl">
              A web-based calendar aggregator for the UO Multicultural Center. Pulls Outlook
              ICS feeds from every MCC student organization and serves a unified, filterable
              event calendar with club management, RSVP tracking, and collaboration tools.
            </p>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <a
              href={GITHUB_REPO}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-muted hover:bg-accent transition-colors text-sm font-medium"
            >
              <Github className="h-4 w-4" />
              GitHub Repository
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            </a>
            <a
              href={API_BASE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-muted hover:bg-accent transition-colors text-sm font-medium"
            >
              <Server className="h-4 w-4" />
              Live API
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            </a>
            <a
              href="/assets/system_architecture.png"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-muted hover:bg-accent transition-colors text-sm font-medium"
            >
              <BookOpen className="h-4 w-4" />
              Full Architecture Diagram
              <ExternalLink className="h-3 w-3 text-muted-foreground" />
            </a>
          </div>
        </div>

        {/* Tech stack */}
        <div className="border-t border-border pt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
          {TECH_STACK.map(({ label, value }) => (
            <div key={label} className="flex gap-2 text-sm">
              <span className="font-medium text-foreground shrink-0 w-24">{label}</span>
              <span className="text-muted-foreground">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Team ─────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Development Team</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DEVELOPERS.map((dev) => (
            <div key={dev.name} className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
                  {dev.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold">{dev.name}</p>
                  <p className="text-xs text-muted-foreground">{dev.role}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{dev.bio}</p>
              <div className="flex gap-2">
                {dev.email && (
                  <a href={`mailto:${dev.email}`}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <Mail className="h-3 w-3" /> {dev.email}
                  </a>
                )}
                {dev.github && (
                  <a href={dev.github} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <Github className="h-3 w-3" /> GitHub
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How to Use the Site ───────────────────────────────────── */}
      <section>
        <h2 className="text-xl font-semibold mb-1 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          How to Use the Site
        </h2>
        <p className="text-sm text-muted-foreground mb-4">Step-by-step guide for visitors and club officers.</p>
        <div className="space-y-3">
          {USE_STEPS.map(({ step, title, desc }) => (
            <div key={step} className="flex gap-4 rounded-lg border border-border bg-card p-4">
              <div className="shrink-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                {step}
              </div>
              <div>
                <p className="font-medium text-sm">{title}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How to Sync Outlook ───────────────────────────────────── */}
      <section>
        <h2 className="text-xl font-semibold mb-1 flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-primary" />
          How to Sync Your Outlook Calendar
        </h2>
        <p className="text-sm text-muted-foreground mb-1">
          For club officers — how to get your Outlook events onto the MCC Calendar Hub automatically.
        </p>
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 px-4 py-2.5 text-sm text-amber-800 dark:text-amber-300">
          <strong>Note:</strong> You need a club officer login to update your ICS URL. Contact the MCC admin if you do not yet have an account — once you do, the calendar link is entirely self-service.
        </div>
        <div className="space-y-3">
          {OUTLOOK_STEPS.slice(0, 5).map(({ step, title, desc }) => (
            <div key={step} className="flex gap-4 rounded-lg border border-border bg-card p-4">
              <div className="shrink-0 h-8 w-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-bold">
                {step}
              </div>
              <div>
                <p className="font-medium text-sm">{title}</p>
                <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-line">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Tagging Guide (inline after step 5) ── */}
        <div className="mt-4 mb-4">
          <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            Club Admin Tagging &amp; Event Guide
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Everything you need to know about how your Outlook events are read, classified, and displayed
            — and how to make your events as useful as possible for students.
          </p>

        {/* ── Event type buckets ── */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold mb-1 flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-primary" />
              How events are sorted into type buckets
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              The sync engine reads the <strong>title</strong> and <strong>description</strong> of each Outlook event
              and assigns it an event type. Prefix the title with the matching tag — the tag is stripped from
              the displayed title so students never see it.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground w-56">Tag(s) to add to title</th>
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground w-36">Keyword fallback</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Bucket shown on site</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { tags: '[E]  or  [Event]', keyword: '—', bucket: 'Events' },
                    { tags: '[M]  or  [Meeting]', keyword: '"meeting" anywhere', bucket: 'Meetings' },
                    { tags: '[OH]  or  [Office Hours]', keyword: '"office hours" anywhere', bucket: 'Office Hours' },
                    { tags: '[O]  or  [Other]', keyword: '—', bucket: 'Other' },
                    { tags: '(none)', keyword: '—', bucket: 'Other  (default)' },
                  ].map(row => (
                    <tr key={row.tags}>
                      <td className="py-2 pr-4"><code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{row.tags}</code></td>
                      <td className="py-2 pr-4 text-xs text-muted-foreground">{row.keyword}</td>
                      <td className="py-2 font-medium text-sm">{row.bucket}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 rounded-lg bg-muted/50 border border-border px-4 py-3 text-sm text-muted-foreground">
              <strong className="text-foreground">Example:</strong>{' '}
              An Outlook event titled <code className="font-mono text-xs bg-background border border-border rounded px-1">[M] Fall Planning Meeting</code> appears
              on the site as <strong>"Fall Planning Meeting"</strong> in the <strong>Meetings</strong> bucket.
            </div>
          </div>

          {/* ── RSVP / ticketing flag ── */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold mb-1 flex items-center gap-2">
              <Ticket className="h-4 w-4 text-primary" />
              RSVP &amp; ticketing flag
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              When the sync detects any of the following signals, it marks the event as requiring RSVP and shows
              a prominent "Tickets / RSVP" button on the event card and detail page.
            </p>
            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              {[
                { signal: '[T] or [Ticket] in title', how: 'Add to the very start of the event title' },
                { signal: 'Word "tickets" in title or desc', how: 'e.g. "Tickets available on Eventbrite"' },
                { signal: 'Word "rsvp" in title or desc', how: 'e.g. "RSVP required by Friday"' },
                { signal: 'Word "register" in title or desc', how: 'e.g. "Register at the link below"' },
              ].map(({ signal, how }) => (
                <div key={signal} className="rounded-lg border border-border bg-muted/30 px-3 py-2">
                  <code className="font-mono text-xs">{signal}</code>
                  <p className="text-xs text-muted-foreground mt-0.5">{how}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              You can also toggle the RSVP flag and add a link + note directly on the event page after logging in —
              useful if registration details aren't ready when you create the Outlook event.
            </p>
          </div>

          {/* ── How the sync works ── */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold mb-1 flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-primary" />
              How the sync works under the hood
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Understanding the sync cycle helps you know when to expect changes and what you can safely edit on the site.
            </p>
            <div className="space-y-2">
              {[
                {
                  label: 'Runs every 14 minutes',
                  detail: 'The backend fetches your ICS feed on a fixed schedule. New Outlook events typically appear on the site within 14 minutes of being created.',
                },
                {
                  label: 'Each event is matched by a unique ID (UID)',
                  detail: 'Outlook assigns every event a stable UID. The sync uses this to update existing events rather than create duplicates. Changing an event in Outlook updates the same record on the site.',
                },
                {
                  label: 'Microsoft Teams boilerplate is stripped automatically',
                  detail: 'Long Teams meeting join links and repeated legal footers are removed from the description. The Teams join URL is preserved in a clean [Teams: https://...] format.',
                },
                {
                  label: 'Manually edited events are frozen',
                  detail: "If you edit an event's title, description, location, or type directly on the site, it gets a 'manually edited' flag. Future syncs skip that event — your on-site version is preserved. An amber banner appears on the event page. Click 'Resume Auto-Sync' to unfreeze.",
                },
                {
                  label: 'Deleted Outlook events are removed',
                  detail: 'If an event no longer appears in your ICS feed (because you deleted or cancelled it in Outlook), the sync removes it from the site automatically.',
                },
                {
                  label: 'Collaboration statuses are never overwritten',
                  detail: "If another club accepts or rejects a collaboration on your event, that decision is permanent — the sync will never reset it back to pending.",
                },
              ].map(({ label, detail }) => (
                <div key={label} className="flex gap-3 text-sm">
                  <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0 translate-y-1.5" />
                  <div>
                    <span className="font-medium">{label} — </span>
                    <span className="text-muted-foreground">{detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Event detail best practices ── */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800 p-5">
            <h3 className="font-semibold mb-1 flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
              <CheckCircle className="h-4 w-4" />
              Make your events clear for students
            </h3>
            <p className="text-sm text-emerald-700 dark:text-emerald-400 mb-4">
              Students use this site to decide whether and how to attend events. The more detail you provide in Outlook,
              the more useful your event listing will be.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                {
                  field: '📍 Location',
                  tip: "Include the building name, room number, or full address. For virtual events add the Teams/Zoom link. Avoid vague entries like \"TBD\" — students won't show up if they can't find you.",
                },
                {
                  field: '📅 Date & time',
                  tip: 'Set accurate start and end times in Outlook. The site displays both. If the end time is wrong students may arrive late or miss the event entirely.',
                },
                {
                  field: '📝 Short description',
                  tip: "Write 1–3 sentences explaining what the event is, who it's for, and why someone should come. Think: \"What would make a student stop scrolling and click?\"",
                },
                {
                  field: '🎟 RSVP / tickets',
                  tip: "If registration is required, include \"RSVP\" or \"Tickets\" in the title or description, and add the link in the event's RSVP field on the site. Students can't register for events they don't know about.",
                },
                {
                  field: '👥 Intended audience',
                  tip: 'Mention in the description whether the event is open to all students, members only, or a specific group. This prevents confusion and helps the right people show up.',
                },
                {
                  field: '🔄 Keep events updated',
                  tip: "If the location, time, or format changes, update it in Outlook (or directly on the site if you've manually edited it). The sync will propagate Outlook changes automatically unless the event is frozen.",
                },
              ].map(({ field, tip }) => (
                <div key={field} className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-emerald-950/30 p-3">
                  <p className="font-medium text-sm text-emerald-900 dark:text-emerald-200 mb-1">{field}</p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        </div>{/* end tagging guide */}

        <div className="space-y-3 mt-4">
          {OUTLOOK_STEPS.slice(5).map(({ step, title, desc }) => (
            <div key={step} className="flex gap-4 rounded-lg border border-border bg-card p-4">
              <div className="shrink-0 h-8 w-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-bold">
                {step}
              </div>
              <div>
                <p className="font-medium text-sm">{title}</p>
                <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-line">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── System Architecture ───────────────────────────────────── */}
      <section>
        <h2 className="text-xl font-semibold mb-1">System Architecture</h2>
        <p className="text-sm text-muted-foreground mb-4">
          3-tier layout: Client (Cloudflare + Vercel) → Application (Render/Express + ICS Sync) → Data (Supabase + Resend).
          Click the image to view the full-size diagram.
        </p>
        <a href="/assets/system_architecture.png" target="_blank" rel="noopener noreferrer"
          className="block rounded-xl border border-border overflow-hidden hover:opacity-95 transition-opacity">
          <img
            src="/assets/system_architecture.png"
            alt="MCC Calendar Hub System Architecture"
            className="w-full"
          />
        </a>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { title: 'Client Tier', color: 'bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800', desc: 'Browser → Cloudflare DNS/SSL → Vercel CDN → React 18 SPA (Vite · Tailwind)' },
            { title: 'Application Tier', color: 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800', desc: 'Render.com: Express REST API + ICS cron sync worker + in-memory cache + logger' },
            { title: 'Data & Services', color: 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800', desc: 'Supabase (PostgreSQL + Auth + Storage) · Resend email delivery · Outlook ICS feeds' },
          ].map(({ title, color, desc }) => (
            <div key={title} className={`rounded-lg border p-3 ${color}`}>
              <p className="font-medium text-sm mb-1">{title}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── API Reference Summary ─────────────────────────────────── */}
      <section>
        <h2 className="text-xl font-semibold mb-1">API Reference</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Base URL: <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{API_BASE_URL}</code>.
          Public endpoints need no auth. Mutations require a <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">Bearer</code> token
          from <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">POST /auth/login</code>.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              group: 'Public',
              color: 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800',
              endpoints: [
                'GET /clubs',
                'GET /events',
                'GET /events/ics?filters=clubId:typeId',
                'GET /event-types',
                'GET /site-settings/:key',
              ],
            },
            {
              group: 'Auth',
              color: 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
              endpoints: [
                'POST /auth/login',
                'GET  /auth/me',
                'POST /auth/forgot-password',
                'POST /auth/reset-password',
                'POST /auth/change-password',
                'POST /auth/change-email',
                'POST /auth/confirm-email',
                'POST /auth/request-account',
              ],
            },
            {
              group: 'Mutations (Bearer token)',
              color: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800',
              endpoints: [
                'PATCH /events/:id',
                'DELETE /events/:id',
                'PATCH /clubs/:id',
                'POST /clubs/:id/logo',
                'POST/DELETE /events/:id/collaborators',
                'PATCH/DELETE /collab/:id',
                'POST/PATCH/DELETE /clubs/:id/members',
              ],
            },
            {
              group: 'Admin (root only)',
              color: 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800',
              endpoints: [
                'GET /admin/users',
                'POST /admin/passwords/:userId',
                'POST /admin/requests/:id/approve',
                'POST /clubs  ·  DELETE /clubs/:id',
                'POST/PATCH/DELETE /event-types/:id',
                'PUT /site-settings/:key',
                'POST /internal/cache/clear (x-sync-secret)',
              ],
            },
          ].map(({ group, color, endpoints }) => (
            <div key={group} className={`rounded-lg border p-4 ${color}`}>
              <p className="font-semibold text-sm mb-2">{group}</p>
              <ul className="space-y-1">
                {endpoints.map(ep => (
                  <li key={ep} className="text-xs font-mono opacity-90">{ep}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
