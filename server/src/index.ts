import express from 'express';
import cors from 'cors';
import { supabase } from './db/supabase';
import { getFromCache, setInCache, clearCacheKey, clearAllCache } from './cache';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
    res.send('MCC Scheduler API is running');
});

// Cache administration (intended for internal use or protected via network/firewall)
app.post('/admin/cache/clear-events', (req, res) => {
    clearCacheKey('events:all');
    res.json({ status: 'ok', cleared: 'events:all' });
});

app.post('/admin/cache/clear-clubs', (req, res) => {
    clearCacheKey('clubs:all');
    res.json({ status: 'ok', cleared: 'clubs:all' });
});

app.post('/admin/cache/clear-all', (req, res) => {
    clearAllCache();
    res.json({ status: 'ok', cleared: 'all' });
});

// Get all events
app.get('/events', async (req, res) => {
    try {
        const cacheKey = 'events:all';
        const cached = getFromCache<any[]>(cacheKey);
        if (cached) {
            return res.json(cached);
        }

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

        if (error) {
            throw error;
        }

        const enhancedData = data.map((event: any) => ({
            ...event,
            club_name: event.clubs?.name,
            club_logo: event.clubs?.logo_url,
            type: event.event_types?.name || 'Other',
            collaborators: event.collaborations?.map((c: any) => c.clubs?.name).filter(Boolean) || []
        }));

        setInCache(cacheKey, enhancedData ?? []);
        res.json(enhancedData);
    } catch (err: any) {
        console.error('Error fetching events:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get all clubs
app.get('/clubs', async (req, res) => {
    try {
        const cacheKey = 'clubs:all';
        const cached = getFromCache<any[]>(cacheKey);
        if (cached) {
            return res.json(cached);
        }

        const { data, error } = await supabase
            .from('clubs')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            throw error;
        }

        setInCache(cacheKey, data ?? []);
        res.json(data);
    } catch (err: any) {
        console.error('Error fetching clubs:', err);
        res.status(500).json({ error: err.message });
    }
});

const { createEvents } = require('ics');

// Generate Custom ICS File
// Query Param Example: ?filters=CLUB_ID_1:TYPE_ID_1,CLUB_ID_2:TYPE_ID_2
// If no TYPE_ID is provided (e.g. CLUB_ID:), it defaults to ALL types for that club.
app.get('/events/ics', async (req, res) => {
    try {
        const filtersParam = req.query.filters as string;
        if (!filtersParam) {
            return res.status(400).send("Missing 'filters' query parameter.");
        }

        // Parse Filters: Array of { clubId, typeId? }
        const rules = filtersParam.split(',').map(rule => {
            const [clubId, typeId] = rule.split(':');
            return { clubId, typeId: typeId || null };
        });

        // Fetch ALL future events (or all valid events)
        // Optimization: We could filter by club_id IN (...) at SQL level, but for now fetch all is fine.
        const { data: events, error } = await supabase
            .from('events')
            .select(`
                *,
                clubs ( name ),
                event_types ( name )
            `)
            .gt('end_time', new Date().toISOString()) // Only future events? Or user wants all? Let's give all useful ones (perhaps last month + future). 
            // Actually, for calendar subscriptions, we usually want everything or at least recent.
            // Let's just fetch all for now, or maybe start from 1 month ago.
            // .gt('start_time', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
            .order('start_time', { ascending: true });

        if (error) throw error;

        // Filter Logic (OR condition across rules)
        const filteredEvents = events.filter((event: any) => {
            return rules.some(rule => {
                const clubMatch = event.club_id === rule.clubId;
                const typeMatch = rule.typeId ? event.type_id === rule.typeId : true; // If no type specified, all types match
                return clubMatch && typeMatch;
            });
        });

        if (filteredEvents.length === 0) {
            // Return empty calendar?
            return res.status(404).send("No events found matching criteria.");
        }

        // Map to ICS format
        const icsEvents = filteredEvents.map((e: any) => {
            const start = new Date(e.start_time);
            const end = new Date(e.end_time);

            return {
                start: [start.getUTCFullYear(), start.getUTCMonth() + 1, start.getUTCDate(), start.getUTCHours(), start.getUTCMinutes()],
                end: [end.getUTCFullYear(), end.getUTCMonth() + 1, end.getUTCDate(), end.getUTCHours(), end.getUTCMinutes()],
                title: e.title,
                description: e.description,
                location: e.location,
                url: e.rsvp_link || undefined,
                uid: e.uid, // Persist original UID to avoid duplicates in user's calendar if they subscribe
                organizer: { name: e.clubs?.name, email: 'mcc-scheduler@uoregon.edu' },
                productId: 'mcc-scheduler/ics'
            };
        });

        // Generate ICS
        createEvents(icsEvents, (err: any, value: string) => {
            if (err) {
                console.error(err);
                return res.status(500).send("Error generating ICS");
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

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

export default app;
