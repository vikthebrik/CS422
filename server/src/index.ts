import express from 'express';
import cors from 'cors';
import { supabase } from './db/supabase';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
    res.send('MCC Scheduler API is running');
});

// Get all events
app.get('/events', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .order('start_time', { ascending: true });

        if (error) {
            throw error;
        }

        res.json(data);
    } catch (err: any) {
        console.error('Error fetching events:', err);
        res.status(500).json({ error: err.message });
    }
});

// Get all clubs
app.get('/clubs', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('clubs')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            throw error;
        }

        res.json(data);
    } catch (err: any) {
        console.error('Error fetching clubs:', err);
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
