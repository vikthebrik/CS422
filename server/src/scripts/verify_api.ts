import { supabase } from '../db/supabase';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function verifyPayload() {
    console.log("--- Simulating /events API Response ---");

    // Simulate the query done in index.ts
    const { data: events, error } = await supabase
        .from('events')
        .select(`
            title,
            start_time,
            location,
            clubs ( name ),
            event_types ( name ),
            collaborations (
                clubs ( name )
            )
        `)
        .limit(3); // Just take 3 for brevity

    if (error) {
        console.error("Query failed:", error);
        return;
    }

    // Simulate the transformation done in index.ts
    const enhancedData = events?.map((event: any) => ({
        title: event.title,
        time: event.start_time,
        host: event.clubs?.name,
        type: event.event_types?.name || 'Other',
        collaborators: event.collaborations?.map((c: any) => c.clubs?.name).filter(Boolean) || []
    }));

    console.log(JSON.stringify(enhancedData, null, 2));

    console.log("\n--- Verification ---");
    if (enhancedData && enhancedData.length > 0) {
        const e = enhancedData[0];
        console.log(`[PASS] Contains Host? ${!!e.host}`);
        console.log(`[PASS] Contains Type? ${!!e.type}`);
        console.log(`[PASS] Contains Collaborators Array? ${Array.isArray(e.collaborators)}`);
    } else {
        console.log("[WARN] No events found to verify.");
    }
}

verifyPayload().catch(console.error);
