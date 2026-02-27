import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import { supabase } from './db/supabase';
import { getFromCache, setInCache, clearCacheKey, clearAllCache } from './cache';
import { requireAuth, requireRoot, AuthenticatedRequest } from './middleware/auth';
import { startCron } from './cron';

// Creates a throwaway Supabase client for signInWithPassword so the shared
// service-role client's session is never polluted by user auth state.
function makeAuthClient() {
  return createClient(
    process.env.SUPABASE_URL ?? '',
    process.env.SUPABASE_KEY ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

const app = express();
const PORT = process.env.PORT || 4000;

// ---------------------------------------------------------------------------
// CORS — allow only the origins listed in ALLOWED_ORIGINS (comma-separated).
// Falls back to localhost:5173 for local development.
// ---------------------------------------------------------------------------
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173'];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '8mb' })); // increased for base64 logo uploads

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
app.get('/', (_req, res) => {
  res.send('MCC Scheduler API is running');
});

// ---------------------------------------------------------------------------
// Auth — all routes proxy through to Supabase Auth so the service key never
// leaves the server.
// ---------------------------------------------------------------------------

// POST /auth/login  { email, password }
// Returns { token, user: { id, name, email, role, clubId } }
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'invalid email format' });
  }

  const { data, error } = await makeAuthClient().auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    return res.status(401).json({ error: error?.message ?? 'Login failed' });
  }

  // Fetch role from user_roles table
  const { data: roleRow, error: roleError } = await supabase
    .from('user_roles')
    .select('role, club_id')
    .eq('user_id', data.user.id)
    .single();

  if (roleError || !roleRow) {
    return res.status(403).json({ error: 'No admin role assigned to this account' });
  }

  // Map DB roles → frontend roles
  const roleMap: Record<string, 'admin' | 'club_officer'> = {
    root: 'admin',
    club_admin: 'club_officer',
  };

  return res.json({
    token: data.session.access_token,
    user: {
      id: data.user.id,
      name: data.user.user_metadata?.name ?? email.split('@')[0],
      email: data.user.email,
      role: roleMap[roleRow.role] ?? 'club_officer',
      clubId: roleRow.club_id ?? null,
    },
  });
});

// GET /auth/me — validate a stored token and return the user
app.get('/auth/me', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { data: roleRow } = await supabase
    .from('user_roles')
    .select('role, club_id')
    .eq('user_id', req.userId)
    .single();

  if (!roleRow) return res.status(403).json({ error: 'No role found' });

  const { data: userData } = await supabase.auth.admin.getUserById(req.userId!);

  const roleMap: Record<string, 'admin' | 'club_officer'> = {
    root: 'admin',
    club_admin: 'club_officer',
  };

  return res.json({
    id: req.userId,
    name: userData?.user?.user_metadata?.name ?? userData?.user?.email?.split('@')[0] ?? req.userId,
    email: userData?.user?.email,
    role: roleMap[roleRow.role] ?? 'club_officer',
    clubId: roleRow.club_id ?? null,
  });
});

// POST /auth/logout — stateless JWT, so just acknowledge; client clears state.
app.post('/auth/logout', (_req, res) => {
  res.json({ status: 'ok' });
});

// POST /auth/forgot-password  { email }
// Sends a Supabase password-reset email. The link in the email redirects to
// FRONTEND_URL/reset-password with the recovery token in the URL hash.
app.post('/auth/forgot-password', async (req, res) => {
  const { email } = req.body as { email?: string };
  if (!email) return res.status(400).json({ error: 'email is required' });

  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${frontendUrl}/reset-password`,
  });

  // Always return 200 to avoid leaking whether an email exists
  if (error) console.error('forgot-password error:', error.message);
  res.json({ status: 'ok' });
});

// POST /auth/reset-password  { token, newPassword }
// Validates the recovery token from the email link and updates the password.
app.post('/auth/reset-password', async (req, res) => {
  const { token, newPassword } = req.body as { token?: string; newPassword?: string };
  if (!token || !newPassword) {
    return res.status(400).json({ error: 'token and newPassword are required' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  // Verify the token and get the user identity
  const { data: { user }, error: tokenError } = await supabase.auth.getUser(token);
  if (tokenError || !user) {
    return res.status(401).json({ error: 'Invalid or expired reset token' });
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
    password: newPassword,
  });
  if (updateError) return res.status(500).json({ error: updateError.message });

  res.json({ status: 'ok' });
});

// POST /auth/request-account  { clubName, contactEmail, message? }
// Publicly accessible — lets clubs without an account submit a request.
app.post('/auth/request-account', async (req, res) => {
  const { clubName, contactEmail, message } = req.body as {
    clubName?: string;
    contactEmail?: string;
    message?: string;
  };
  if (!clubName || !contactEmail) {
    return res.status(400).json({ error: 'clubName and contactEmail are required' });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(contactEmail)) {
    return res.status(400).json({ error: 'invalid email format' });
  }

  const { error } = await supabase
    .from('account_requests')
    .insert({ club_name: clubName, contact_email: contactEmail, message: message ?? null });

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ status: 'ok' });
});

// ---------------------------------------------------------------------------
// Internal endpoint — used by sync_all.ts to clear the cache after a sync.
// Protected by a shared secret, NOT a user JWT.
// ---------------------------------------------------------------------------
app.post('/internal/cache/clear', (req, res) => {
  const secret = req.headers['x-sync-secret'];
  if (!secret || secret !== process.env.SYNC_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  clearAllCache();
  res.json({ status: 'ok', cleared: 'all' });
});

// ---------------------------------------------------------------------------
// Cache administration (root admin only — kept for manual use)
// ---------------------------------------------------------------------------
app.post('/admin/cache/clear-events', requireRoot, (_req, res) => {
  clearCacheKey('events:all');
  res.json({ status: 'ok', cleared: 'events:all' });
});

app.post('/admin/cache/clear-clubs', requireRoot, (_req, res) => {
  clearCacheKey('clubs:all');
  res.json({ status: 'ok', cleared: 'clubs:all' });
});

app.post('/admin/cache/clear-all', requireRoot, (_req, res) => {
  clearAllCache();
  res.json({ status: 'ok', cleared: 'all' });
});

// ---------------------------------------------------------------------------
// GET /events
// ---------------------------------------------------------------------------
app.get('/events', async (_req, res) => {
  try {
    const cacheKey = 'events:all';
    const cached = getFromCache<any[]>(cacheKey);
    if (cached) return res.json(cached);

    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        clubs ( name, logo_url ),
        event_types ( name ),
        collaborations (
          club_id,
          clubs ( name )
        )
      `)
      .order('start_time', { ascending: true });

    if (error) throw error;

    const enhancedData = data.map((event: any) => ({
      ...event,
      club_name: event.clubs?.name,
      club_logo: event.clubs?.logo_url,
      type: event.event_types?.name ?? 'Other',
      collaborators: event.collaborations?.map((c: any) => c.clubs?.name).filter(Boolean) ?? [],
    }));

    setInCache(cacheKey, enhancedData ?? []);
    res.json(enhancedData);
  } catch (err: any) {
    console.error('Error fetching events:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// PATCH /events/:id — update event fields (auth required, scoped by role)
// ---------------------------------------------------------------------------
app.patch('/events/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { title, description, location, eventType, rsvpLink } = req.body as {
    title?: string;
    description?: string;
    location?: string;
    eventType?: string;
    rsvpLink?: string | null;
  };

  try {
    // If club_admin, verify the event belongs to their club
    if (req.userRole === 'club_admin') {
      const { data: existing } = await supabase
        .from('events')
        .select('club_id')
        .eq('id', id)
        .single();

      if (!existing || existing.club_id !== req.userClubId) {
        return res.status(403).json({ error: 'You can only edit your own club\'s events' });
      }
    }

    // Resolve eventType name → type_id
    let typeId: string | null = null;
    if (eventType) {
      const { data: et } = await supabase
        .from('event_types')
        .select('id')
        .eq('name', eventType)
        .single();
      typeId = et?.id ?? null;
    }

    const updates: Record<string, any> = { manually_edited: true };
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (location !== undefined) updates.location = location;
    if (typeId) updates.type_id = typeId;
    if (rsvpLink !== undefined) {
      updates.rsvp_link = rsvpLink || null;
      if (rsvpLink) updates.requires_rsvp = true;
    }

    const { data, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', id)
      .select(`*, clubs(name, logo_url), event_types(name)`)
      .single();

    if (error) throw error;

    clearCacheKey('events:all');
    res.json({
      ...data,
      club_name: (data as any).clubs?.name,
      type: (data as any).event_types?.name ?? 'Other',
    });
  } catch (err: any) {
    console.error('Error updating event:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /events — create a new event (auth required, manually_edited = true)
// ---------------------------------------------------------------------------
app.post('/events', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { title, description, location, eventType, clubId, startTime, endTime, rsvpLink } = req.body;

  if (!title || !clubId || !startTime || !endTime) {
    return res.status(400).json({ error: 'title, clubId, startTime, and endTime are required' });
  }

  if (req.userRole === 'club_admin' && clubId !== req.userClubId) {
    return res.status(403).json({ error: 'You can only create events for your own organization' });
  }

  try {
    // Resolve eventType name → type_id
    let typeId: string | null = null;
    if (eventType) {
      const { data: typeRow } = await supabase
        .from('event_types')
        .select('id')
        .eq('name', eventType)
        .single();
      if (typeRow) typeId = typeRow.id;
    }

    const uid = `manual-${crypto.randomUUID()}`;

    const { data, error } = await supabase
      .from('events')
      .insert({
        uid,
        title,
        description: description ?? '',
        location: location ?? '',
        club_id: clubId,
        type_id: typeId,
        start_time: startTime,
        end_time: endTime,
        manually_edited: true,
        requires_rsvp: !!rsvpLink || /\b(ticket|rsvp)\b/i.test(description ?? ''),
        rsvp_link: rsvpLink || null,
      })
      .select(`*, clubs(name, logo_url), event_types(name)`)
      .single();

    if (error) throw error;

    clearCacheKey('events:all');
    res.status(201).json({
      ...data,
      club_name: (data as any).clubs?.name,
      club_logo: (data as any).clubs?.logo_url,
      type: (data as any).event_types?.name ?? 'Other',
    });
  } catch (err: any) {
    console.error('Error creating event:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// DELETE /events/:id — delete an event (auth required, scoped by role)
// ---------------------------------------------------------------------------
app.delete('/events/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;

  try {
    if (req.userRole === 'club_admin') {
      const { data: existing } = await supabase
        .from('events')
        .select('club_id')
        .eq('id', id)
        .single();

      if (!existing || existing.club_id !== req.userClubId) {
        return res.status(403).json({ error: 'You can only delete your own club\'s events' });
      }
    }

    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) throw error;

    clearCacheKey('events:all');
    res.json({ status: 'ok' });
  } catch (err: any) {
    console.error('Error deleting event:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /clubs
// ---------------------------------------------------------------------------
app.get('/clubs', async (_req, res) => {
  try {
    const cacheKey = 'clubs:all';
    const cached = getFromCache<any[]>(cacheKey);
    if (cached) return res.json(cached);

    const { data, error } = await supabase
      .from('clubs')
      .select('*, org_type')
      .order('name', { ascending: true });

    if (error) throw error;

    setInCache(cacheKey, data ?? []);
    res.json(data);
  } catch (err: any) {
    console.error('Error fetching clubs:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// PATCH /clubs/:id — update club profile (auth required, scoped by role)
// ---------------------------------------------------------------------------
app.patch('/clubs/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { description, instagram, linktree, engage, outlookLink } = req.body as {
    description?: string;
    instagram?: string;
    linktree?: string;
    engage?: string;
    outlookLink?: string;
  };

  try {
    if (req.userRole === 'club_admin' && req.userClubId !== id) {
      return res.status(403).json({ error: 'You can only update your own club' });
    }

    // Fetch existing jsonb columns to merge rather than overwrite
    const { data: current } = await supabase
      .from('clubs')
      .select('metadata_tags, social_links')
      .eq('id', id)
      .single();

    const currentMeta = (current?.metadata_tags as Record<string, any>) ?? {};
    const currentSocial = (current?.social_links as Record<string, any>) ?? {};

    const updates: Record<string, any> = {};
    if (description !== undefined) {
      updates.metadata_tags = { ...currentMeta, description };
    }
    if (instagram !== undefined || linktree !== undefined || engage !== undefined) {
      updates.social_links = {
        ...currentSocial,
        ...(instagram !== undefined ? { instagram } : {}),
        ...(linktree !== undefined ? { linktree } : {}),
        ...(engage !== undefined ? { engage } : {}),
      };
    }
    if (outlookLink !== undefined) {
      updates.ics_source_url = outlookLink || null;
    }

    const { data, error } = await supabase
      .from('clubs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    clearCacheKey('clubs:all');
    res.json(data);
  } catch (err: any) {
    console.error('Error updating club:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Color helpers for logo-based club color assignment
// ---------------------------------------------------------------------------
function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function rgbDistance(h1: string, h2: string): number {
  const [r1, g1, b1] = hexToRgb(h1);
  const [r2, g2, b2] = hexToRgb(h2);
  return Math.sqrt((r2 - r1) ** 2 + (g2 - g1) ** 2 + (b2 - b1) ** 2);
}

/** Rotate the hue of a hex color by `degrees` (0-360). */
function rotateHue(hex: string, degrees: number): string {
  let [r, g, b] = hexToRgb(hex).map(v => v / 255) as [number, number, number];
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  h = ((h * 360 + degrees) % 360) / 360;
  const sFinal = Math.max(0.45, s);
  const lFinal = Math.min(0.65, Math.max(0.35, l));
  const q = lFinal < 0.5 ? lFinal * (1 + sFinal) : lFinal + sFinal - lFinal * sFinal;
  const p = 2 * lFinal - q;
  const hue2rgb = (t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return '#' + [hue2rgb(h + 1 / 3), hue2rgb(h), hue2rgb(h - 1 / 3)]
    .map(v => Math.round(v * 255).toString(16).padStart(2, '0'))
    .join('');
}

/** Ensure `color` is at least MIN_DISTANCE away from all other clubs' colors. */
async function deduplicateColor(color: string, excludeClubId: string): Promise<string> {
  const MIN_DISTANCE = 85;
  const { data } = await supabase.from('clubs').select('metadata_tags').neq('id', excludeClubId);
  const existingColors: string[] = (data ?? [])
    .map((c: any) => c.metadata_tags?.color)
    .filter((c: any) => typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c));

  let result = color;
  for (let attempt = 0; attempt < 12; attempt++) {
    if (!existingColors.some(ec => rgbDistance(result, ec) < MIN_DISTANCE)) break;
    result = rotateHue(result, 30);
  }
  return result;
}

// ---------------------------------------------------------------------------
// POST /clubs/:id/logo  { logo: "data:<mime>;base64,<data>", color?: "#rrggbb" }
// Upload a club logo image to Supabase Storage and update logo_url.
// If `color` is provided, stores it in metadata_tags.color after de-duplication.
// Root can update any club; club_admin can only update their own.
// ---------------------------------------------------------------------------
app.post('/clubs/:id/logo', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { logo, color } = req.body as { logo?: string; color?: string };
  if (!logo) return res.status(400).json({ error: 'logo is required' });

  try {
    if (req.userRole === 'club_admin' && req.userClubId !== id) {
      return res.status(403).json({ error: 'You can only update your own club logo' });
    }

    // Parse the data URL: "data:<mime>;base64,<data>"
    const match = logo.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (!match) return res.status(400).json({ error: 'Invalid image data URL' });
    const [, contentType, base64Data] = match;
    const ext = contentType.split('/')[1].replace('+xml', '');
    const buffer = Buffer.from(base64Data, 'base64');
    const filename = `${id}.${ext}`;

    // Ensure the bucket exists (no-op if already exists)
    await supabase.storage.createBucket('club-logos', { public: true }).catch(() => {});

    // Upload (upsert so re-uploading replaces the previous logo)
    const { error: uploadError } = await supabase.storage
      .from('club-logos')
      .upload(filename, buffer, { contentType, upsert: true });

    if (uploadError) return res.status(500).json({ error: uploadError.message });

    const { data: { publicUrl } } = supabase.storage.from('club-logos').getPublicUrl(filename);

    // Build the DB update payload
    const updatePayload: Record<string, any> = { logo_url: publicUrl };

    // If the frontend supplied an extracted dominant color, de-duplicate it
    // against all other clubs and store in metadata_tags.color
    if (color && /^#[0-9a-f]{6}$/i.test(color)) {
      const uniqueColor = await deduplicateColor(color, id as string);
      // Merge into existing metadata_tags (JSONB)
      const { data: existing } = await supabase
        .from('clubs').select('metadata_tags').eq('id', id).single();
      const existingTags = (existing as any)?.metadata_tags ?? {};
      updatePayload.metadata_tags = { ...existingTags, color: uniqueColor };
    }

    const { data, error: updateError } = await supabase
      .from('clubs')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (updateError) return res.status(500).json({ error: updateError.message });

    clearCacheKey('clubs:all');
    res.json({ logo_url: publicUrl, club: data });
  } catch (err: any) {
    console.error('Error uploading logo:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /clubs — create a new club (root only)
// ---------------------------------------------------------------------------
app.post('/clubs', requireRoot, async (_req: AuthenticatedRequest, res) => {
  const { name, orgType, description } = _req.body as {
    name?: string;
    orgType?: 'union' | 'department';
    description?: string;
  };
  if (!name?.trim()) return res.status(400).json({ error: 'name is required' });

  const metadata_tags: Record<string, any> = {};
  if (description?.trim()) metadata_tags.description = description.trim();

  const { data, error } = await supabase
    .from('clubs')
    .insert({
      name: name.trim(),
      org_type: orgType ?? 'union',
      metadata_tags: Object.keys(metadata_tags).length ? metadata_tags : null,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  clearCacheKey('clubs:all');
  res.status(201).json(data);
});

// ---------------------------------------------------------------------------
// DELETE /clubs/:id — delete a club and all its events/roles (root only)
// ---------------------------------------------------------------------------
app.delete('/clubs/:id', requireRoot, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  try {
    // 1. Delete all events belonging to this club
    const { error: eventsError } = await supabase.from('events').delete().eq('club_id', id);
    if (eventsError) throw eventsError;

    // 2. Remove user_roles rows tied to this club (orphaned club admin accounts)
    const { error: rolesError } = await supabase.from('user_roles').delete().eq('club_id', id);
    if (rolesError) throw rolesError;

    // 3. Delete the club itself
    const { error: clubError } = await supabase.from('clubs').delete().eq('id', id);
    if (clubError) throw clubError;

    clearCacheKey('clubs:all');
    clearCacheKey('events:all');
    res.json({ status: 'ok' });
  } catch (err: any) {
    console.error('Error deleting club:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /admin/requests — list all account requests (root only)
// ---------------------------------------------------------------------------
app.get('/admin/requests', requireRoot, async (_req, res) => {
  const { data, error } = await supabase
    .from('account_requests')
    .select('id, club_name, contact_email, message, status, created_at')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

// ---------------------------------------------------------------------------
// POST /admin/requests/:id/approve  { orgType? }
// Creates club + auth user + user_role; marks request approved.
// Returns: { clubId, clubName, email, password }
// ---------------------------------------------------------------------------
app.post('/admin/requests/:id/approve', requireRoot, async (req: AuthenticatedRequest, res) => {
  const requestId = req.params.id as string;
  const { orgType = 'union' } = req.body as { orgType?: string };

  const { data: request, error: fetchErr } = await supabase
    .from('account_requests')
    .select('id, club_name, contact_email, status')
    .eq('id', requestId)
    .single();

  if (fetchErr || !request) return res.status(404).json({ error: 'Request not found' });
  if ((request as any).status !== 'pending') {
    return res.status(400).json({ error: `Request is already ${(request as any).status}` });
  }

  const clubName = (request as any).club_name as string;
  const email = (request as any).contact_email as string;
  // Generate a simple memorable password
  const password =
    Math.random().toString(36).slice(2, 8) +
    Math.random().toString(36).slice(2, 5).toUpperCase() +
    '!1';

  try {
    // 1. Create club
    const { data: club, error: clubErr } = await supabase
      .from('clubs')
      .insert({ name: clubName, org_type: orgType })
      .select('id, name')
      .single();

    if (clubErr || !club) throw clubErr ?? new Error('Failed to create club');

    // 2. Create auth user
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authErr || !authData?.user) {
      await supabase.from('clubs').delete().eq('id', (club as any).id);
      throw authErr ?? new Error('Failed to create auth user');
    }

    const userId = authData.user.id;

    // 3. Insert user_role (without raw_password first, in case column doesn't exist yet)
    const { error: roleErr } = await supabase.from('user_roles').insert({
      user_id: userId,
      email,
      club_id: (club as any).id,
      role: 'club_admin',
    });

    if (roleErr) {
      await supabase.auth.admin.deleteUser(userId);
      await supabase.from('clubs').delete().eq('id', (club as any).id);
      throw roleErr;
    }

    // 4. Try to store the plaintext password for the admin UI (best-effort — column may not exist)
    await supabase.from('user_roles').update({ raw_password: password }).eq('user_id', userId);

    // 5. Mark request approved
    await supabase.from('account_requests').update({ status: 'approved' }).eq('id', requestId);

    clearCacheKey('clubs:all');

    res.json({ clubId: (club as any).id, clubName: (club as any).name, email, password });
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? 'Approval failed' });
  }
});

// ---------------------------------------------------------------------------
// POST /admin/requests/:id/reject
// ---------------------------------------------------------------------------
app.post('/admin/requests/:id/reject', requireRoot, async (req: AuthenticatedRequest, res) => {
  const { error } = await supabase
    .from('account_requests')
    .update({ status: 'rejected' })
    .eq('id', req.params.id as string);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ status: 'ok' });
});

// ---------------------------------------------------------------------------
// GET /admin/users — list all club admin accounts (root only)
// Returns: { id, email, clubId, clubName }[]
// ---------------------------------------------------------------------------
app.get('/admin/users', requireRoot, async (_req, res) => {
  const { data, error } = await supabase
    .from('user_roles')
    .select('user_id, email, club_id, raw_password, clubs ( name )')
    .eq('role', 'club_admin')
    .order('email', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });

  const users = (data ?? []).map((row: any) => ({
    id: row.user_id,
    email: row.email,
    clubId: row.club_id,
    clubName: row.clubs?.name ?? null,
    rawPassword: row.raw_password ?? null,
  }));

  res.json(users);
});

// POST /admin/passwords/:userId  { newPassword }
// Root admin forcibly sets a club admin's password.
// ---------------------------------------------------------------------------
app.post('/admin/passwords/:userId', requireRoot, async (req: AuthenticatedRequest, res) => {
  const userId = req.params.userId as string;
  const { newPassword } = req.body as { newPassword?: string };
  if (!newPassword) return res.status(400).json({ error: 'newPassword is required' });
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const { error } = await supabase.auth.admin.updateUserById(userId, { password: newPassword });
  if (error) return res.status(500).json({ error: error.message });

  // Persist the raw password so root admin can look it up later
  await supabase.from('user_roles').update({ raw_password: newPassword }).eq('user_id', userId);

  res.json({ status: 'ok' });
});

// ---------------------------------------------------------------------------
// Event Types CRUD (root admin only)
// ---------------------------------------------------------------------------
app.get('/event-types', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('event_types')
      .select('id, name')
      .order('name', { ascending: true });
    if (error) throw error;
    res.json(data ?? []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/event-types', requireRoot, async (req: AuthenticatedRequest, res) => {
  const { name } = req.body as { name?: string };
  if (!name?.trim()) return res.status(400).json({ error: 'name is required' });

  const { data, error } = await supabase
    .from('event_types')
    .insert({ name: name.trim() })
    .select('id, name')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

app.patch('/event-types/:id', requireRoot, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { name } = req.body as { name?: string };
  if (!name?.trim()) return res.status(400).json({ error: 'name is required' });

  const { data, error } = await supabase
    .from('event_types')
    .update({ name: name.trim() })
    .eq('id', id)
    .select('id, name')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.delete('/event-types/:id', requireRoot, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('event_types').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ status: 'ok' });
});

// ---------------------------------------------------------------------------
// GET /events/ics — generate a custom ICS calendar file
// Query: ?filters=CLUB_ID_1:TYPE_ID_1,CLUB_ID_2:TYPE_ID_2
// Omit TYPE_ID to include all types for that club: CLUB_ID:
// ---------------------------------------------------------------------------
const { createEvents } = require('ics');

app.get('/events/ics', async (req, res) => {
  try {
    const filtersParam = req.query.filters as string;
    if (!filtersParam) {
      return res.status(400).send("Missing 'filters' query parameter.");
    }

    const rules = filtersParam.split(',').map(rule => {
      const [clubId, typeId] = rule.split(':');
      return { clubId, typeId: typeId || null };
    });

    const { data: events, error } = await supabase
      .from('events')
      .select(`*, clubs ( name ), event_types ( name )`)
      .gt('end_time', new Date().toISOString())
      .order('start_time', { ascending: true });

    if (error) throw error;

    const filteredEvents = events.filter((event: any) =>
      rules.some(rule => {
        const clubMatch = event.club_id === rule.clubId;
        const typeMatch = rule.typeId ? event.type_id === rule.typeId : true;
        return clubMatch && typeMatch;
      })
    );

    if (filteredEvents.length === 0) {
      return res.status(404).send('No events found matching criteria.');
    }

    const icsEvents = filteredEvents.map((e: any) => {
      const start = new Date(e.start_time);
      const end = new Date(e.end_time);
      return {
        start: [start.getUTCFullYear(), start.getUTCMonth() + 1, start.getUTCDate(), start.getUTCHours(), start.getUTCMinutes()],
        end: [end.getUTCFullYear(), end.getUTCMonth() + 1, end.getUTCDate(), end.getUTCHours(), end.getUTCMinutes()],
        title: e.title,
        description: e.description,
        location: e.location,
        url: e.rsvp_link ?? undefined,
        uid: e.uid,
        organizer: { name: e.clubs?.name, email: 'mcc-scheduler@uoregon.edu' },
        productId: 'mcc-scheduler/ics',
      };
    });

    createEvents(icsEvents, (err: any, value: string) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Error generating ICS');
      }
      res.setHeader('Content-Type', 'text/calendar');
      res.setHeader('Content-Disposition', 'attachment; filename=custom-schedule.ics');
      res.send(value);
    });
  } catch (err: any) {
    console.error('Error serving ICS:', err);
    res.status(500).send(err.message);
  }
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    startCron();
  });
}

export default app;
