import express from 'express';
import cors from 'cors';
import { supabase } from './db/supabase';
import { getFromCache, setInCache, clearCacheKey, clearAllCache } from './cache';
import { requireAuth, requireRoot, AuthenticatedRequest } from './middleware/auth';

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
app.use(express.json());

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

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
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
    name: userData?.user?.user_metadata?.name ?? req.userId,
    email: userData?.user?.email,
    role: roleMap[roleRow.role] ?? 'club_officer',
    clubId: roleRow.club_id ?? null,
  });
});

// POST /auth/logout — stateless JWT, so just acknowledge; client clears state.
app.post('/auth/logout', (_req, res) => {
  res.json({ status: 'ok' });
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
  const { title, description, location, eventType } = req.body as {
    title?: string;
    description?: string;
    location?: string;
    eventType?: string;
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

    const updates: Record<string, any> = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (location !== undefined) updates.location = location;
    if (typeId) updates.type_id = typeId;

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
      .select('*')
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
  const { description, instagram, linktree, engage } = req.body as {
    description?: string;
    instagram?: string;
    linktree?: string;
    engage?: string;
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
  });
}

export default app;
