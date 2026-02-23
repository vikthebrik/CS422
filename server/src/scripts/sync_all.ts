import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { populate } from './populate_supabase';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const CLUBS_FILE = path.resolve(__dirname, '../../clubs.json');

interface ClubDef {
    name: string;
    url: string;
}

async function syncAll() {
    console.log('Starting batch sync...');

    if (!fs.existsSync(CLUBS_FILE)) {
        console.error(`clubs.json not found at ${CLUBS_FILE}`);
        process.exit(1);
    }

    const clubs: ClubDef[] = JSON.parse(fs.readFileSync(CLUBS_FILE, 'utf-8'));

    console.log(`Found ${clubs.length} clubs to sync.`);

    for (const club of clubs) {
        try {
            await populate(club.name, club.url);
        } catch (error) {
            console.error(`Failed to sync club: ${club.name}`, error);
            // Continue to next club
        }
    }

    console.log('Batch sync completed.');

    // Cache Warming Logic
    const PORT = process.env.PORT || 4000;
    const baseUrl = `http://localhost:${PORT}`;

    console.log(`Attempting to clear and warn cache at ${baseUrl}...`);

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

        // 2. Warm Cache (Trigger fetches)
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
        // This is not fatal for the sync itself
    }
}

syncAll().catch(err => {
    console.error('Fatal error in batch sync:', err);
    process.exit(1);
});
