import { supabase } from '../db/supabase';
import nodeIcal from 'node-ical';
import path from 'path';
import dotenv from 'dotenv';

// Load env vars explicitly if running as script, though supabase.ts also does it.
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export async function populate(clubName: string, icsUrl: string) {
    console.log(`Starting population for club: ${clubName}`);
    console.log(`Fetching ICS from: ${icsUrl}`);

    try {
        // 1. Upsert Club
        const { data: club, error: clubError } = await supabase
            .from('clubs')
            .upsert({ name: clubName, ics_source_url: icsUrl }, { onConflict: 'name' })
            .select()
            .single();

        if (clubError) {
            throw new Error(`Failed to upsert club: ${clubError.message}`);
        }

        console.log(`Club ensured: ${club.id}`);

        // Fetch Event Types for mapping
        const { data: eventTypesData, error: eventTypesError } = await supabase
            .from('event_types')
            .select('id, name');

        if (eventTypesError) {
            console.error("Error fetching event types:", eventTypesError);
            // We can continue but types will be null or default
        }

        const eventTypeMap: Record<string, string> = {};
        if (eventTypesData) {
            eventTypesData.forEach((et) => {
                eventTypeMap[et.name.toLowerCase()] = et.id;
            });
        }

        // 2. Fetch and Parse ICS
        const events = await nodeIcal.async.fromURL(icsUrl);

        // 3. Process Events
        const upsertPayload = [];

        // Helpers for simple heuristic classification
        const classifyEvent = (title: string, desc: string): string | null => {
            const text = (title + " " + desc).toLowerCase();
            if (text.includes("office hours")) return eventTypeMap["office hours"];
            if (text.includes("meeting") || text.includes("weekly")) return eventTypeMap["weekly meeting"];
            // Default fallback logic could go here, or return null to mean "Other" or "Large Event" based on further rules
            return eventTypeMap["large event"] || null;
        };

        const checkRsvp = (desc: string): { required: boolean, link: string | null } => {
            const text = desc.toLowerCase();
            const required = text.includes("rsvp") || text.includes("register") || text.includes("ticket");
            let link = null;

            if (required) {
                // Simple regex to find a URL in the description
                const urlRegex = /(https?:\/\/[^\s]+)/g;
                const matches = desc.match(urlRegex);
                if (matches && matches.length > 0) {
                    // Heuristic: take the first link found
                    link = matches[0];
                }
            }
            return { required, link };
        };

        for (const key in events) {
            if (events.hasOwnProperty(key)) {
                const event = events[key];
                if (event.type === 'VEVENT') {
                    // Robust date handling
                    let start = event.start;
                    let end = event.end;

                    // If start/end are undefined, skip or handle appropriately
                    if (!start || !end) {
                        console.warn(`Skipping event ${event.uid} due to missing start/end time`);
                        continue;
                    }

                    const title = event.summary || 'Untitled Event';
                    const description = event.description || '';
                    const typeId = classifyEvent(title, description);
                    const rsvpInfo = checkRsvp(description);

                    upsertPayload.push({
                        club_id: club.id,
                        uid: event.uid,
                        title: title,
                        description: description,
                        location: event.location || '',
                        start_time: start.toISOString(),
                        end_time: end.toISOString(),
                        last_updated: new Date().toISOString(),
                        type_id: typeId,
                        requires_rsvp: rsvpInfo.required,
                        rsvp_link: rsvpInfo.link
                    });
                }
            }
        }

        console.log(`Found ${upsertPayload.length} events.`);

        if (upsertPayload.length > 0) {
            // Upsert events in batches if needed, but for now single batch is fine for MVP
            const { error: eventsError } = await supabase
                .from('events')
                .upsert(upsertPayload, { onConflict: 'club_id,uid' });

            if (eventsError) {
                throw new Error(`Failed to upsert events: ${eventsError.message}`);
            }
            console.log('Events successfully populated.');
        } else {
            console.log('No events to populate.');
        }

    } catch (error) {
        console.error('Error running population script:', error);
        // Don't exit process here so other calls can proceed if imported
        throw error;
    }
}

// Only run if called directly
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.error('Usage: ts-node src/scripts/populate_supabase.ts <CLUB_NAME> <ICS_URL>');
        process.exit(1);
    }

    const [clubNameArg, icsUrlArg] = args;
    populate(clubNameArg, icsUrlArg).catch(() => process.exit(1));
}
