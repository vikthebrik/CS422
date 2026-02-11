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
            .select('*')
            .order('start_time', { ascending: true });

        if (error) {
            throw error;
        }

        setInCache(cacheKey, data ?? []);
        res.json(data);
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

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
