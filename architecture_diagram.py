"""
MCC Calendar Hub — System Architecture Diagram (matplotlib)
Run:    python3 architecture_diagram.py
Output: system_architecture.png
"""
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch

FIG_W, FIG_H = 36, 26
fig, ax = plt.subplots(figsize=(FIG_W, FIG_H))
ax.set_xlim(0, FIG_W)
ax.set_ylim(0, FIG_H)
ax.axis('off')
fig.patch.set_facecolor('#EBEDF0')
ax.set_facecolor('#EBEDF0')

C = {
    'cf':     ('#FFF3E0', '#E65100'),
    'vercel': ('#F5F5F5', '#333333'),
    'render': ('#E8F0FE', '#1A73E8'),
    'supa':   ('#E6F4EA', '#1E8E3E'),
    'resend': ('#FCE4EC', '#AD1457'),
    'ext':    ('#ECEFF1', '#546E7A'),
    'white':  ('#FFFFFF', '#AAAAAA'),
}

HDR_H   = 0.80
FS_BODY = 22
FS_HDR  = 19
FS_ZONE = 19
FS_ARR  = 14
FS_TIER = 20

def zone(x, y, w, h, label, key, zorder=0):
    bg, border = C[key]
    ax.add_patch(FancyBboxPatch((x, y), w, h,
        boxstyle='round,pad=0.18', fc=bg, ec=border, lw=2.8, zorder=zorder))
    ax.text(x+0.25, y+h-0.18, label, ha='left', va='top',
            fontsize=FS_ZONE, fontweight='bold', color=border, zorder=zorder+1)

def box(x, y, w, h, title, lines, key='white', zorder=2):
    bg, border = C[key]
    ax.add_patch(FancyBboxPatch((x, y), w, h,
        boxstyle='round,pad=0.08', fc=bg, ec=border, lw=1.8, zorder=zorder))
    ax.add_patch(FancyBboxPatch((x+0.04, y+h-HDR_H), w-0.08, HDR_H-0.04,
        boxstyle='round,pad=0.04', fc=border, ec='none', zorder=zorder+1))
    ax.text(x+w/2, y+h-HDR_H/2, title, ha='center', va='center',
            fontsize=FS_HDR, fontweight='bold', color='white', zorder=zorder+2)
    ax.text(x+0.18, y+h-HDR_H-0.10, '\n'.join(lines),
            ha='left', va='top', fontsize=FS_BODY, color='#1A1A1A',
            family='monospace', linespacing=1.35, zorder=zorder+2)

# ── gap_label: places a labelled arrow whose text sits in the
#    inter-column gap at x≈22.4 (outside every box on both sides)
def arr(x1, y1, x2, y2, label='', color='#555555', lw=1.6, dashed=False,
        rad=0.0, lx=None, ly=None, bold=False, fs=None):
    ax.annotate('', xy=(x2,y2), xytext=(x1,y1),
        arrowprops=dict(arrowstyle='->', color=color, lw=2.4 if bold else lw,
            linestyle=(0,(5,4)) if dashed else '-',
            connectionstyle=f'arc3,rad={rad}'), zorder=6)
    if label:
        tlx = lx if lx is not None else (x1+x2)/2
        tly = ly if ly is not None else (y1+y2)/2
        ax.text(tlx, tly, label, ha='center', va='center',
                fontsize=fs if fs else FS_ARR, color=color,
                bbox=dict(boxstyle='round,pad=0.22', fc='white',
                          ec=color, alpha=0.97, lw=0.9), zorder=8)

# ─────────────────────────────────────────────────────────────────────────────
# TITLE
ax.text(FIG_W/2, FIG_H-0.25, 'MCC Calendar Hub — System Architecture',
        ha='center', va='top', fontsize=34, fontweight='bold', color='#1A1A2E')
ax.text(FIG_W/2, FIG_H-0.95,
        'uomcc.org  ·  api.uomcc.org  ·  Vercel + Render + Supabase + Resend + Cloudflare',
        ha='center', va='top', fontsize=18, color='#444444')

# ─────────────────────────────────────────────────────────────────────────────
# ZONE BACKGROUNDS
zone(0.30,  0.40, 8.50, 23.90, '  CLIENT TIER', 'cf', zorder=0)
zone(9.20,  0.40,13.00, 23.90, '  ③ Render  —  api.uomcc.org:10000  (Express)', 'render', zorder=0)
zone(22.60, 0.40,13.10, 23.90, '  DATA & SERVICES TIER', 'supa', zorder=0)

# ─────────────────────────────────────────────────────────────────────────────
# COLUMN A — CLIENT TIER
box(1.0, 21.5, 6.8, 2.40, 'End User / Club Admin — Browser', [
    'Any visitor to uomcc.org (HTTPS)',
    'Club admins log in for management',
    'JWT: localStorage · mcc_auth_token',
], 'white', zorder=2)

box(1.0, 17.3, 6.8, 3.80, '① Cloudflare  —  DNS + Edge', [
    'DNS Proxy + SSL/TLS + DDoS',
    '──────────────────────────',
    'uomcc.org      → Vercel CDN',
    'api.uomcc.org  → Render :10000',
], 'cf', zorder=2)

zone(0.80, 0.60, 7.20, 16.30, '  ② Vercel — uomcc.org (Static SPA)', 'vercel', zorder=1)

box(1.0, 14.00, 6.8, 2.60, 'Vercel Edge CDN', [
    'pnpm build → global CDN deploy',
    'VITE_API_BASE_URL env var',
    'Serves static build output',
], 'vercel', zorder=2)

box(1.0, 0.90, 6.8, 12.70, 'React 18 SPA  (Vite · TypeScript · Tailwind)', [
    'AppContext     global state provider',
    ' events · clubs · auth · filters',
    'useClubs       fetch + color palette',
    'useEvents      fetch + map + typeIdMap',
    '────────────────────────────────',
    'Dashboard      CalendarGrid views',
    'FilterSidebar  per-club type filter',
    'EventPage      detail · edit · collabs',
    '               auto-sync pause banner',
    'ClubPage       profile · team roster',
    'ClubManagement root admin portal',
    'Collab         pending/accepted/past',
    'About          block CMS (public)',
    '────────────────────────────────',
    'Auth routes (5):',
    ' /forgot-password  /reset-password',
    ' /request-account  /change-password',
    ' /confirm-email',
    '────────────────────────────────',
    'NO Supabase client on frontend',
    'All auth proxied via Express API',
], 'vercel', zorder=2)

# ─────────────────────────────────────────────────────────────────────────────
# COLUMN B — RENDER
box(9.40, 13.20, 12.60, 10.70, 'Express API  (src/index.ts)', [
    'PUBLIC                      AUTH',
    'GET /clubs                  POST /auth/login',
    'GET /events                 POST /auth/forgot-password',
    'GET /events/ics?filters=    POST /auth/reset-password',
    'GET /event-types            POST /auth/change-password',
    'GET /site-settings/:key     POST /auth/change-email',
    '                            POST /auth/confirm-email',
    'MUTATIONS (Bearer token)    GET  /auth/me',
    'PATCH /events/:id           ADMIN (requireRoot)',
    '  → manually_edited=true    GET  /admin/users',
    '  → resumeSync clears flag  POST /admin/requests/:id/approve',
    'PATCH/POST/DELETE /clubs    PATCH /admin/users/:id/email',
    'POST /clubs/:id/logo        POST /admin/passwords/:userId',
    'POST/DELETE /events/:id/collaborators[/:id]',
    'PATCH/DELETE /collab/:id    INTERNAL',
    'POST/PATCH/DELETE /clubs/:id/members[/:id]',
    '                            POST /internal/cache/clear',
    '                                 (x-sync-secret header)',
    '──────────────────────────────────────────────────',
    'Body: 8 MB  |  CORS: ALLOWED_ORIGINS',
    'Roles: root (admin) · club_admin (own org)',
], 'render', zorder=2)

box(9.40, 9.90, 3.95, 3.00, 'Cache  (src/cache.ts)', [
    'In-memory TTL store',
    'CACHE_TTL_SECONDS',
    '─────────────────',
    'events:all',
    'clubs:all',
    'event-types:all',
], 'render', zorder=2)

box(13.55, 9.90, 3.95, 3.00, 'Logger  (src/logger.ts)', [
    'Ring buffer · 200 entries',
    'HTTP middleware',
    '─────────────────',
    'info · success · warn',
    'error · cron',
    'auth · cache',
], 'render', zorder=2)

box(17.70, 9.90, 3.95, 3.00, 'Dashboard', [
    'Status page (public)',
    '─────────────────',
    'GET /  → HTML',
    'GET /status → JSON',
    'POST /admin/sync',
    '  (x-sync-secret)',
], 'render', zorder=2)

box(9.40, 0.65, 12.60, 8.90, 'ICS Sync Worker  (cron.ts · sync_all.ts · populate_supabase.ts)', [
    'SYNC_CRON_SCHEDULE (default: */14 * * * *)',
    'Keeps last 20 SyncRun records',
    '──────────────────────────────────────────',
    'Per club with ics_source_url:',
    '1. HTTP GET <ics_source_url> → parse .ics',
    '2. Classify: [E] [M] [OH] [O] by tags',
    '   [T]/tickets/rsvp → requires_rsvp=true',
    '3. Strip MS Teams boilerplate from desc',
    '4. PARTSTAT → collaboration status',
    '5. Upsert collabs: ignoreDuplicates=true',
    '   User accept/reject NEVER overwritten',
    '6. manually_edited=true → only update',
    '   last_updated; all fields frozen',
    '7. Prune UIDs absent from current feed',
    '8. POST /internal/cache/clear',
    'Club lookup: by ics_source_url (not name)',
], 'render', zorder=2)

# ─────────────────────────────────────────────────────────────────────────────
# COLUMN C — DATA & SERVICES TIER
zone(22.80, 7.30, 12.70, 16.80, '  ④ Supabase — PostgreSQL · Auth · Storage', 'supa', zorder=1)

box(23.00, 7.55, 8.40, 16.25, 'PostgreSQL  (service role key)', [
    'events',
    ' uid · title · description · location',
    ' start_time · end_time · type_id',
    ' club_id · manually_edited (m009)',
    ' requires_rsvp · rsvp_link · rsvp_note',
    ' last_updated',
    'clubs',
    ' name · org_type (union|department)',
    ' ics_source_url · logo_url',
    ' social_links · metadata_tags (jsonb)',
    'collaborations',
    ' event_id · club_id · role',
    ' status: pending|accepted|rejected',
    'user_roles',
    ' user_id · email · role · club_id',
    ' raw_password (migration 010)',
    'event_types    id · name',
    'account_requests',
    ' club_name · contact_email · status',
    'site_settings  key · value (jsonb)',
    ' about-page → Block[] (CMS)',
    'club_members   (migration 014)',
    ' name · title · section · email',
    ' photo_url · sort_order · club_id',
    '─────────────────────────────',
    'Migrations 001–014',
    'server/src/db/migrations/',
], 'supa', zorder=2)

box(31.60, 15.30, 3.85, 8.50, 'Supabase Auth', [
    'admin.generateLink()',
    ' type: recovery',
    ' → hashed_token',
    ' (PKCE bypass)',
    'admin.verifyOtp(',
    ' token_hash,',
    " type:'recovery'",
    ')',
    'admin.createUser()',
    ' seed + approval',
    'admin',
    '.updateUserById()',
    ' pwd + email',
    '──────────────',
    'No Supabase client',
    'on frontend.',
    'All auth via',
    'backend only.',
], 'supa', zorder=2)

box(31.60, 7.55, 3.85, 7.50, 'Storage Buckets', [
    'club-logos',
    ' POST /clubs/:id/logo',
    ' base64 → public URL',
    ' root or club_admin',
    'member-photos',
    ' POST …/photo',
    ' max 300px · WebP',
    'mcc-public-assets',
    ' POST /site-settings',
    '      /upload',
    ' About page media',
], 'supa', zorder=2)

box(22.80, 3.20, 12.70, 3.90, '⑤ Resend — Email Delivery (HTTP/443)', [
    'RESEND_API_KEY · SMTP_FROM: noreply@uomcc.org',
    'HTTP/443 — Render blocks SMTP (25/465/587)',
    'fire-and-forget: Express responds immediately',
    '──────────────────────────────────────────',
    'Password reset:   MCC-branded HTML, token_hash',
    'Account approval: credentials to contact email',
    'Email-change:     HMAC link, 24h expiry',
], 'resend', zorder=2)

box(22.80, 0.65, 12.70, 2.30, 'External — Outlook / Microsoft 365 (ICS Feeds)', [
    'One .ics URL per club stored in clubs.ics_source_url',
    'Cron: HTTP GET every SYNC_CRON_SCHEDULE',
    'Lookup by ics_source_url — admin deletes are permanent',
], 'ext', zorder=2)

# ─────────────────────────────────────────────────────────────────────────────
# ARROWS
#
# Label placement strategy:
#  • Col A internal arrows   → label inline (safe, no box crossings)
#  • Col A → Col B arrows    → label in the A-B gap  (x ≈ 8.6, outside all boxes)
#  • Col B internal          → NO label (self-evident from box headers)
#  • Col B → Col C arrows    → label placed in the B-C column gap  (x = 22.42)
#                              which is outside ALL boxes on both sides;
#                              short text keeps the label bbox within the gap.
#  • Express→Auth/Storage    → arrow arc routed ABOVE the PostgreSQL box
#                              (starts at top of Express y=23.90, arcs above y=23.80)
#                              label placed in top-canvas margin (y ≈ 25.2-25.6)
# ─────────────────────────────────────────────────────────────────────────────

# ── Col A internal ────────────────────────────────────────────────────────────
arr(4.4, 21.5,  4.4, 21.1,  'HTTPS', '#E65100', bold=True)
arr(4.4, 17.3,  4.4, 16.60, 'uomcc.org → Vercel CDN', '#333333')
arr(4.4, 14.0,  4.4, 13.60, 'static build', '#333333')

# ── Col A → Col B  (labels in A-B gap, x ≈ 8.6) ─────────────────────────────
# Cloudflare → Render (horizontal, gap midpoint is x=8.6, y=19.2)
arr(7.8, 19.20, 9.40, 19.20,
    'api.uomcc.org → Render :10000', '#E65100', lw=2.0, bold=True)

# React SPA → Express (arc; label placed in gap at x=8.6, between col A boxes)
arr(7.8, 10.5, 9.40, 18.55,
    'fetch() /api/*\nVITE_API_BASE_URL\nBearer JWT',
    '#1A73E8', bold=True, rad=-0.22, lx=8.6, ly=15.5)

# ── Col B internal – NO labels (connections obvious from box titles) ───────────
arr(11.38, 13.20, 11.38, 12.90, '', '#1A73E8', lw=1.4)   # Express→Cache
arr(15.53, 13.20, 15.53, 12.90, '', '#1A73E8', lw=1.4)   # Express→Logger
arr(19.68, 13.20, 19.68, 12.90, '', '#1A73E8', lw=1.4, dashed=True)  # Express→Dashboard
arr(21.60, 13.20, 21.60, 9.55,  '', '#1A73E8', lw=1.4)   # Express→Cron

# ── Col B → Col C: all labels in B-C gap (x=22.42, outside every box) ────────
# The B-C inter-zone strip (x=22.20–22.60) is clear of all box rectangles.
# Short text (≤ ~14 chars/line) keeps the white label bbox within the strip.

# Express → PostgreSQL (short hop across the gap, label just above crossing)
arr(22.00, 22.00, 23.00, 22.00,
    'DB reads/writes\nSUPABASE_KEY',
    '#1E8E3E', bold=True, lx=22.42, ly=22.55)

# Express → Auth: arc that travels ABOVE the top of the PostgreSQL box (y=23.80)
# so the arrow line itself never enters the PostgreSQL rectangle.
# Start: top-right corner of Express box.  End: left edge of Auth box near top.
arr(22.00, 23.87, 31.60, 23.60,
    'Auth Admin API\ngenerateLink · verifyOtp\ncreateUser · updateUserById',
    '#1E8E3E', rad=0.18, lx=26.8, ly=25.2)
# ly=25.2 is above the zone background tops (y≈24.3) and above tier labels (y=24.55+0.3)

# Express → Storage: arc from top of Express, label in top-canvas margin
arr(22.00, 23.87, 31.60, 14.90,
    'Storage uploads\nclub-logos · member-photos\nmcc-public-assets',
    '#1E8E3E', rad=0.35, lx=26.8, ly=25.7)
# Higher arc rad pushes midpoint further upward → label at ly=25.7 clears Auth label

# Express → Resend: arrow leaves from BOTTOM of Express (y=13.20), curves down-right
# to Resend box top (y=7.10). Label sits in the B-C gap at x=22.42.
arr(22.00, 13.20, 22.80, 7.10,
    'Resend SDK\nHTTP/443',
    '#AD1457', bold=True, rad=0.12, lx=22.42, ly=10.1)

# Cron → Outlook: arrow from Cron bottom-right (y=1.80) to Outlook left edge.
# Label in gap (x=22.42), well below all boxes in col B.
arr(22.00, 1.80, 22.80, 1.65,
    'HTTP GET .ics\nSYNC_CRON_SCHEDULE',
    '#546E7A', dashed=True, lx=22.42, ly=1.15)

# Cron → PostgreSQL: arc from Cron right edge, label in B-C gap.
arr(22.00, 5.40, 23.00, 9.30,
    'upsert events\n& collabs',
    '#1E8E3E', rad=-0.20, lx=22.42, ly=7.35)

# Cache-clear: Cron triggers POST /internal/cache/clear back to Express.
# Arrow goes back UP along x=22.10 (just outside Express/Cron right edge at x=22.00).
# Label in B-C gap, between the Resend label (y≈10.1) and the DB label (y≈22.55).
arr(22.00, 9.55, 22.00, 13.20, '',  '#0D47A1', dashed=True, lw=1.2)
ax.text(22.42, 11.35, '/cache/clear\n(x-sync-secret)',
        ha='center', va='center', fontsize=FS_ARR, color='#0D47A1',
        bbox=dict(boxstyle='round,pad=0.22', fc='white', ec='#0D47A1', alpha=0.97, lw=0.8),
        zorder=8)

# ── Column dividers ────────────────────────────────────────────────────────────
for xd in [9.0, 22.5]:
    ax.plot([xd, xd], [0.4, 24.3], color='#CCCCCC', lw=1.0, ls='--', zorder=0)

# ── Tier labels ────────────────────────────────────────────────────────────────
for xc, label in [(4.4,'CLIENT TIER'),(15.7,'APPLICATION TIER'),(29.1,'DATA & SERVICES TIER')]:
    ax.text(xc, 24.55, label, ha='center', va='bottom',
            fontsize=FS_TIER, fontweight='bold', color='#888888', style='italic')

plt.tight_layout(pad=0.4)
plt.savefig('system_architecture.png', dpi=100, bbox_inches='tight',
            facecolor=fig.get_facecolor())
print("Saved: system_architecture.png")
