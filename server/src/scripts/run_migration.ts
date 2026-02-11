
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const connectionString = process.env.SUPABASE_DB_URL; // Assuming standard SUPABASE_DB_URL
// If not, use the connection string from env or construct it if possible. 
// BUT we only have SUPABASE_URL (REST) usually.
// Unless the user provided the "connection string" explicitly.
// Let's check .env if we can. 
// Actually I cannot read .env directly as that's user secret, but I can check for keys.

async function runCallback(client: any) {
    try {
        const sql = fs.readFileSync(path.resolve(__dirname, '../db/migrations/001_schema_upgrade.sql'), 'utf-8');
        await client.connect();
        await client.query(sql);
        console.log('Migration applied successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

// If DB_URL missing, we'll try to deduce or fail.
if (!process.env.DATABASE_URL && !process.env.SUPABASE_DB_URL) {
    console.error("No DATABASE_URL found. Please run the SQL script manually in Supabase Dashboard SQL Editor.");
    process.exit(1);
}

const client = new Client({
    connectionString: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL,
});

runCallback(client);
