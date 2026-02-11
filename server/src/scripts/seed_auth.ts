
import { supabase } from '../db/supabase';
import bcrypt from 'bcrypt';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const SALT_ROUNDS = 10;

async function seedAuth() {
    console.log("--- Seeding Authentication Data ---");

    // 1. Ensure Multicultural Center Club Exists
    const mccName = "Multicultural Center";
    // Placeholder ICS if not provided, or real one if user has it.
    // Using a dummy one for now if creating new.
    const mccIcs = "https://example.com/mcc.ics";

    console.log(`Ensuring club: ${mccName}`);
    const { data: mccClub, error: clubError } = await supabase
        .from('clubs')
        .upsert({ name: mccName, ics_source_url: mccIcs }, { onConflict: 'name' })
        .select('id, name')
        .single();

    if (clubError) {
        console.error("Failed to upsert MCC club:", clubError);
        return;
    }
    console.log(`MCC Club ID: ${mccClub.id}`);

    // 2. Create Root Admin User
    const rootEmail = "mcc@uoregon.edu"; // Default placeholder
    const rootPassword = "password123"; // Default for development

    const passwordHash = await bcrypt.hash(rootPassword, SALT_ROUNDS);

    console.log(`Creating Root Admin: ${rootEmail}`);

    // Check if user exists to avoid duplicate key error or just upsert
    // But our users table schema: id, email unique, password_hash, role, club_id
    const { data: user, error: userError } = await supabase
        .from('users')
        .upsert({
            email: rootEmail,
            password_hash: passwordHash,
            role: 'root_admin',
            club_id: mccClub.id // Linked to MCC
        }, { onConflict: 'email' })
        .select()
        .single();

    if (userError) {
        console.error("Failed to seed root user:", userError);
        return;
    }

    console.log("Root Admin successfully seeded.");
    console.log(`Email: ${rootEmail}`);
    console.log(`Password: ${rootPassword}`);
    console.log("--- Done ---");
}

seedAuth().catch(console.error);
