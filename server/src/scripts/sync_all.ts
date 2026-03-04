import dotenv from 'dotenv';
import path from 'path';
import { supabase } from '../db/supabase';
import { populate } from './populate_supabase';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function syncAll() {
    console.log('Starting batch sync...');

    const { data: clubs, error } = await supabase
        .from('clubs')
        .select('id, name, ics_source_url')
        .not('ics_source_url', 'is', null);

    if (error) {
        console.error('Failed to fetch clubs from DB:', error.message);
        process.exit(1);
    }

    console.log(`Found ${clubs.length} clubs with ICS URLs.`);

    for (const club of clubs) {
        try {
            await populate(club.name, club.ics_source_url!);
        } catch (err: any) {
            console.error(`Failed to sync club: ${club.name}`, err.message);
            // Continue to next club
        }
    }

    console.log('Batch sync completed.');

    // Cache Warming Logic
    const PORT = process.env.PORT || 4000;
    const baseUrl = `http://localhost:${PORT}`;

    console.log(`Attempting to clear and warm cache at ${baseUrl}...`);

    try {
        // 1. Clear Cache using the shared sync secret (no user JWT required)
        const clearRes = await fetch(`${baseUrl}/internal/cache/clear`, {
            method: 'POST',
            headers: { 'x-sync-secret': process.env.SYNC_SECRET ?? '' },
        });
        if (clearRes.ok) {
            console.log('Cache cleared successfully.');
        } else {
            console.warn(`Failed to clear cache: ${clearRes.status} ${clearRes.statusText}`);
        }

        // 2. Warm Cache
        console.log('Warming cache (fetching events & clubs)...');
        const [eventsRes, clubsRes] = await Promise.all([
            fetch(`${baseUrl}/events`),
            fetch(`${baseUrl}/clubs`)
        ]);

        if (eventsRes.ok && clubsRes.ok) {
            console.log('Cache warmed successfully! Next page load should be fast.');
        } else {
            console.warn('Failed to warm cache completely.');
        }

    } catch (err) {
        console.warn('Could not contact server to clear/warm cache. Is the server running?');
        // Not fatal for the sync itself
    }
}

syncAll().catch(err => {
    console.error('Fatal error in batch sync:', err);
    process.exit(1);
});
