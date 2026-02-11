import { supabase } from '../db/supabase';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function verify() {
    console.log("--- Verifying Event Types ---");
    const { data: types, error: typesError } = await supabase
        .from('event_types')
        .select('*');

    if (typesError) console.error(typesError);
    else console.table(types);

    console.log("\n--- Event Distribution by Type ---");
    // We need to join manually or just fetch all and aggregate if no tailored view
    const { data: events, error: eventsError } = await supabase
        .from('events')
        .select(`
            title,
            type_id,
            event_types (name)
        `);

    if (eventsError) {
        console.error(eventsError);
        return;
    }

    const counts: Record<string, number> = {};
    if (events) {
        events.forEach((e: any) => {
            const typeName = e.event_types?.name || 'Unknown/Null';
            counts[typeName] = (counts[typeName] || 0) + 1;
        });
    }
    console.table(counts);

    console.log("\n--- Sample Check (First 5 'Other' events) ---");
    // Check if some 'Other' events SHOULD have been Meetings
    const otherEvents = events?.filter((e: any) => e.event_types?.name === 'Other').slice(0, 5);
    otherEvents?.forEach((e: any) => console.log(`[Other] ${e.title}`));

}

verify().catch(console.error);
