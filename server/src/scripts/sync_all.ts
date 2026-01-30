import fs from 'fs';
import path from 'path';
import { populate } from './populate_supabase';

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
}

syncAll().catch(err => {
    console.error('Fatal error in batch sync:', err);
    process.exit(1);
});
