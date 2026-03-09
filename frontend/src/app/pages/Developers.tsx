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

import { ExternalLink, Github, Server, BookOpen, Calendar, RefreshCw, Mail, Tag, FolderOpen, CheckCircle, Heart, Linkedin } from 'lucide-react';

const GITHUB_REPO = 'https://github.com/vikthebrik/CS422';
const API_BASE_URL = 'https://api.uomcc.org';

const DEVELOPERS = [
  {
    name: 'Vikram',
    role: 'Lead Full-Stack Developer',
    email: '',
    github: 'https://github.com/vikthebrik',
    linkedin: '',
    bio: 'Led end-to-end architecture design, database modeling, and domain deployment. Managed user/stakeholder communication and debugging. Built the Express REST API, ICS sync pipeline, Supabase auth & PostgreSQL integration, email automation, and full frontend build.',
  },
  {
    name: 'Maddie',
    role: 'Frontend Developer & UI Design',
    email: '',
    github: 'https://github.com/madelineluu',
    linkedin: '',
    bio: 'Contributed to front end design and testing, server hosting, backend logic and caching, UI/UX layout decisions, and user-facing feature development across the React SPA.',
  },
  {
    name: 'Rayna',
    role: 'Frontend Developer & QA',
    email: '',
    github: 'https://github.com/raynapatel',
    linkedin: '',
    bio: 'Contributed to frontend development, cross-browser testing, and ensuring a consistent user experience across the application.',
  },
  {
    name: 'Eireann',
    role: 'Frontend Developer & Documentation',
    email: '',
    github: 'https://github.com/EireannCoelho',
    linkedin: '',
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
    title: "Find your club calendar's sharing link in Outlook",
    desc: "Open Outlook on the web (outlook.office365.com) and go to your club's group calendar.Click the Settings gear → \"Shared calendars\" → \"Publish a calendar.\" Choose your calendar, set the permission to \"Can view all details,\" then click Publish and copy the link that appears — it will end in .ics.",
  },
  {
    step: '2',
    title: "Connect the link to your club profile — one time only",
    desc: "Sign in to the MCC Calendar Hub → navigate to your club's page → click \"Edit Organization Info\" → paste the link into the \"Outlook Calendar ICS URL\" field → Save.That's it. You only have to do this once, and your events will begin appearing on the site automatically within 15 minutes.",
  },
  {
    step: '3',
    title: "Create events in Outlook — the site handles the rest",
    desc: "From this point on, just create events in your club's group calendar in Outlook the same way you always have.The MCC Calendar Hub checks your calendar every 15 minutes and pulls in any new or updated events automatically — no manual entry needed on the site.",
    note: "Keep in mind: Microsoft's own systems can take 2 to 12 hours to make a brand- new calendar link visible to outside tools.If your events don't show up right away after the initial setup, this is normal — they will appear once Microsoft finishes publishing your calendar.",
  },
  {
    step: '4',
    title: "Label your events so students can filter them",
    desc: "Put a short tag at the very start of the event title to tell the site what kind of event it is. The tag is hidden from students — they only see the clean title. Without a tag, the event is filed under \"Other.\"",
  },
  {
    step: '5',
    title: "Add an RSVP or tickets notice when sign-up is required",
    desc: "If students need to register or buy tickets, include the word \"RSVP,\" \"Tickets,\" or \"Register\" anywhere in the title or description. The site will automatically show a Tickets / RSVP button on the event. You can also add or update the RSVP link directly on the event page after logging in — useful when registration details aren't ready yet.",
  },
  {
    step: '6',
    title: "Edit events on the site when you need more control",
    desc: "Log in → open the event page → click Edit to change the title, description, location, or event type directly on the site. Once you do this, the event is \"locked\" — future Outlook syncs won't touch it, so your manual edits are safe.\n\nIf you later want Outlook to take over again(for example, because you're updating the event there), click \"Resume Auto-Sync\" on the amber notice at the top of the event page.",
  },
  {
    step: '7',
    title: "Update your sharing link if it ever changes",
    desc: "If your Outlook calendar link ever stops working — for example after an org leadership handoff or a calendar reset — just paste the new link in the same \"Edit Organization Info\" field on your club page. No need to contact the MCC admin.",
  },
  {
    step: '8',
    title: "Co-host events with other MCC clubs",
    desc: "To show another club as a collaborator on your event, invite one of their members as an attendee in Outlook. The site will automatically create a collaboration request for that club. Once they accept, their club's badge appears on the event listing.You can also add or remove collaborators manually from the event page at any time.",
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
            <h1 className="text-3xl font-bold tracking-tight mt-2">Usage Guide</h1>
            <p className="text-muted-foreground mt-2 max-w-xl">
              Everything you need to get the most out of the MCC Calendar Hub — whether you're
              a student browsing events or a club officer managing your organization's calendar.
            </p>
          </div>
          <div className="flex flex-col gap-2 shrink-0">
            <a
              href="#how-to-use"
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors text-sm font-medium text-emerald-800 dark:text-emerald-300"
            >
              <Calendar className="h-4 w-4" />
              How to Use the Site
            </a>
            <a
              href="#club-admin"
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-sm font-medium text-blue-800 dark:text-blue-300"
            >
              <RefreshCw className="h-4 w-4" />
              Manage as a Club Admin
            </a>
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
              href="#system-architecture"
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-muted hover:bg-accent transition-colors text-sm font-medium"
            >
              <BookOpen className="h-4 w-4" />
              Full Architecture Diagram
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
                {dev.linkedin && (
                  <a href={dev.linkedin} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <Linkedin className="h-3 w-3" /> LinkedIn
                  </a>
                )}
              </div>
            </div>
          ))}

          {/* ── Special Thanks card ── */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div>
              <p className="font-semibold">Special Thanks</p>
              <p className="text-xs text-muted-foreground">Inspirations &amp; Contributors</p>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <p className="text-sm font-medium">Miguel Pimienta</p>
                  <a href="https://github.com/MiguelPimienta19/MiguelPimienta19" target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <Github className="h-3 w-3" /> GitHub
                  </a>
                </div>
                <p className="text-xs text-muted-foreground">Helped foster the idea early and gave us the inspiration to build this.</p>
              </div>
              <div className="border-t border-border" />
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <p className="text-sm font-medium">Damien Macalino</p>
                  <a href="https://www.linkedin.com/in/damien-macalino/" target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <Linkedin className="h-3 w-3" /> LinkedIn
                  </a>
                </div>
                <p className="text-xs text-muted-foreground">Help with assets and ongoing support throughout the project.</p>
              </div>
            </div>
          </div>

          {/* ── Community card ── */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div>
              <p className="font-semibold flex items-center gap-1.5">
                <Heart className="h-4 w-4 text-rose-500" /> Thank You
              </p>
              <p className="text-xs text-muted-foreground">Built with and for the community</p>
            </div>
            <div className="space-y-2.5 text-xs text-muted-foreground">
              <div>
                <p className="font-medium text-foreground text-sm mb-0.5">The MCC Community</p>
                <p>Thank you to the Multicultural Center at the University of Oregon for the space and support that inspired this project.</p>
              </div>
              <div>
                <p className="font-medium text-foreground text-sm mb-0.5">Cultural Clubs &amp; Organizations</p>
                <p>To every club that shares events and keeps the community thriving — this hub is for you.</p>
              </div>
              <div>
                <p className="font-medium text-foreground text-sm mb-0.5">Our Families</p>
                <p>For the encouragement and support that made all of this possible.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How to Use the Site ───────────────────────────────────── */}
      <section id="how-to-use" className="scroll-mt-24">
        <h2 className="text-xl font-semibold mb-1 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          How to Use the Site
        </h2>
        <p className="text-sm text-muted-foreground mb-4">Step-by-step general usage guide for visitors on how to maximize the site's potential.</p>
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
      <section id="club-admin" className="scroll-mt-24">
        <h2 className="text-xl font-semibold mb-1 flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-primary" />
          How to Manage Page as Club Admin
        </h2>
        <p className="text-sm text-muted-foreground mb-1">
          A step-by-step guide on connecting and organizing your events on the Hub.
        </p>
        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 px-4 py-2.5 text-sm text-amber-800 dark:text-amber-300">
          <strong>Note:</strong> You need a club officer login to update your ICS URL. Contact the MCC admin if you do not yet have an account — once you do, the calendar link is entirely self-service.
        </div>
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 px-4 py-3 text-sm text-blue-800 dark:text-blue-300 space-y-1">
          <p><strong>Sync timing:</strong> The MCC Calendar Hub refreshes your Outlook ICS feed every <strong>15 minutes</strong>. However, Microsoft Outlook and UO Microsoft calendars can take <strong>2 to 12 hours</strong> to propagate changes within their own systems before the updated feed is visible to external services like this one. If your event doesn't appear immediately, this is usually why — just wait a bit and it will sync automatically.</p>
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

          {/* ── Event type buckets & RSVP/Tickets ── */}
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-semibold mb-1 flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-primary" />
                How events are sorted &amp; flagged (Filters and RSVPs)
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                The sync engine reads the <strong>title</strong> and <strong>description</strong> of each Outlook event
                and assigns it an event type (for filtering) and an RSVP flag (for ticketing). The tag is stripped from
                the displayed title so students never see it.
              </p>

              <h4 className="font-medium text-sm mb-2 text-foreground">1. Setting Event Types (Buckets)</h4>
              <div className="overflow-x-auto mb-4">
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

              <h4 className="font-medium text-sm mt-6 mb-2 text-foreground">2. Setting Tickets &amp; RSVP</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Include any of the following to automatically display a "Tickets / RSVP" button on your event.
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

              <div className="mt-4 rounded-lg bg-muted/50 border border-border px-4 py-3 text-sm text-muted-foreground">
                <strong className="text-foreground">Example Combo:</strong>{' '}
                An Outlook event titled <code className="font-mono text-xs bg-background border border-border rounded px-1">[M][T] Fall Planning Meeting</code> appears
                in the <strong>Meetings</strong> bucket and receives a <strong>Tickets / RSVP</strong> badge.
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Note: You can also toggle the RSVP flag and add a link + note directly on the event page after logging in via the Hub Admin Dashboard —
                useful if registration details aren't ready when you create the Outlook event.
              </p>
            </div>

            {/* ── Event detail best practices ── */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800 p-5">
              <h3 className="font-semibold mb-1 flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                <CheckCircle className="h-4 w-4" />
                Make your events clear for students
              </h3>
              <p className="text-sm text-emerald-700 dark:text-emerald-400 mb-3">
                Students use this site to decide whether and how to attend events. The more detail you provide in Outlook,
                the more useful your event listing will be.
              </p>
              <p className="text-sm text-emerald-700 dark:text-emerald-400 mb-4">
                <strong className="text-emerald-900 dark:text-emerald-200">Why tagging and details matter:</strong> Students who subscribe to your club's calendar receive notifications directly in Outlook, Google Calendar, or Apple Calendar — the event title and description are the first (and sometimes only) thing they see. A clear title with the right tag ensures the event is categorized correctly on the site <em>and</em> gives subscribers enough context to decide whether to show up, all from a single calendar notification.
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
      <section id="system-architecture" className="scroll-mt-24">
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

        {/* ── How the sync works (Moved to System Architecture) ── */}
        <div className="rounded-xl border border-border bg-card p-5 mt-6">
          <h3 className="font-semibold mb-1 flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-primary" />
            Under the hood: Event Synchronization
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            Technical details on the custom ICS sync cycle between the Node.js backend and University of Oregon calendars.
          </p>
          <div className="space-y-2">
            {[
              {
                label: 'Cron Job Schedule',
                detail: 'The backend worker pulls ICS feeds on a rolling schedule. Events appear on the site roughly 15 minutes after being successfully published to the ICS link.',
              },
              {
                label: 'UID Reconciliation',
                detail: 'Outlook assigns every event a stable UID. The continuous sync script reconciles this, executing partial UPSERTs into PostgreSQL to update records instead of duplicating.',
              },
              {
                label: 'Regex Cleaners',
                detail: 'The sync leverages Regex parsing to wipe boilerplate Teams meeting links and repetitive legal footers from descriptions.',
              },
              {
                label: 'State Locks',
                detail: "Editing an event via the Admin UI sets a boolean flag preventing the cron script from touching that event row in the future (disabling Outlook priority).",
              },
              {
                label: 'Cascading Purge',
                detail: 'ICS events absent from the active feed are auto-garbage collected within matching horizons.',
              },
              {
                label: 'Permanent Approvals',
                detail: "Approved / Rejected event collaboration status takes priority over raw ICS attendee lists.",
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
