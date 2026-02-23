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

        console.log(`Club ensured: ${club.id} (${club.name})`);

        // Fetch Event Types for mapping
        const { data: eventTypesData, error: eventTypesError } = await supabase
            .from('event_types')
            .select('id, name');

        if (eventTypesError) {
            console.error("Error fetching event types:", eventTypesError);
        }

        const eventTypeMap: Record<string, string> = {};
        if (eventTypesData) {
            eventTypesData.forEach((et) => {
                eventTypeMap[et.name.toLowerCase()] = et.id;
            });
        }

        const getTypeId = (name: string): string | null => {
            if (!name) return null;
            return eventTypeMap[name.toLowerCase()] || null;
        };

        // 2. Fetch and Parse ICS
        const events = await nodeIcal.async.fromURL(icsUrl);

        // 3. Process Events
        let processedCount = 0;
        let collabCount = 0;

        // Helpers for classification
        const classifyEvent = (title: string, desc: string): string | null => {
            const text = (title + " " + desc).toLowerCase();

            // Strict Parsing Logic based on Tags
            // [Event] or [E] -> Events
            if (text.includes("[event]") || text.includes("[e]")) return getTypeId("Events");

            // [Meeting] or [M] -> Meetings
            if (text.includes("[meeting]") || text.includes("[m]")) return getTypeId("Meetings");

            // [Office Hours] or [OH] -> Office Hours
            if (text.includes("[office hours]") || text.includes("[oh]")) return getTypeId("Office Hours");

            // [Other] or [O] -> Other
            if (text.includes("[other]") || text.includes("[o]")) return getTypeId("Other");

            // Default
            return getTypeId("Other");
        };

        const checkRsvp = (desc: string): { required: boolean, link: string | null } => {
            const text = desc.toLowerCase();
            const required = text.includes("rsvp") || text.includes("register") || text.includes("ticket");
            let link = null;

            if (required) {
                const urlRegex = /(https?:\/\/[^\s]+)/g;
                const matches = desc.match(urlRegex);
                if (matches && matches.length > 0) {
                    link = matches[0];
                }
            }
            return { required, link };
        };

        const processedUids: string[] = [];

        for (const key in events) {
            if (events.hasOwnProperty(key)) {
                // @ts-ignore
                const event = events[key];
                if (event.type === 'VEVENT') {
                    // Robust date handling
                    const start = event.start;
                    const end = event.end;

                    if (!start || !end) {
                        console.warn(`Skipping event ${event.uid} due to missing start/end time`);
                        continue;
                    }

                    const title = event.summary || 'Untitled Event';
                    const description = event.description || '';
                    const location = event.location || '';
                    const typeId = classifyEvent(title, description); // Apply Strict Classification
                    const rsvpInfo = checkRsvp(description);
                    const uid = event.uid; // ICS UID

                    processedUids.push(uid);

                    // DUPLICATE & COLLABORATION LOGIC

                    // Check if event with this UID already exists (globally)
                    // This handles "duplicate events flagged" by UID.
                    const { data: existingEvents, error: fetchError } = await supabase
                        .from('events')
                        .select('id, club_id')
                        .eq('uid', uid);

                    if (fetchError) {
                        console.error(`Error checking existence for ${uid}:`, fetchError);
                        continue;
                    }

                    const existingEvent = existingEvents && existingEvents.length > 0 ? existingEvents[0] : null;

                    if (existingEvent) {
                        // Event exists!
                        if (existingEvent.club_id === club.id) {
                            // It belongs to THIS club (Primary). Update it.
                            const { error: updateError } = await supabase
                                .from('events')
                                .update({
                                    title: title,
                                    description: description,
                                    location: location,
                                    start_time: new Date(start).toISOString(),
                                    end_time: new Date(end).toISOString(),
                                    last_updated: new Date().toISOString(),
                                    type_id: typeId,
                                    requires_rsvp: rsvpInfo.required,
                                    rsvp_link: rsvpInfo.link
                                })
                                .eq('id', existingEvent.id);

                            if (updateError) console.error(`Failed to update event ${uid}:`, updateError);
                            else processedCount++;

                        } else {
                            // It belongs to ANOTHER club. This is a COLLABORATION.
                            // The first club to sync this UID became the Primary.
                            // We add this current club as a Secondary collaborator.
                            const { error: collabError } = await supabase
                                .from('collaborations')
                                .upsert({
                                    event_id: existingEvent.id,
                                    club_id: club.id,
                                    role: 'secondary',
                                    status: 'pending' // Admin must approve
                                }, { onConflict: 'event_id,club_id' });

                            if (collabError) console.error(`Failed to add collaboration for ${uid}:`, collabError);
                            else collabCount++;
                        }
                    } else {
                        // Event does not exist. Create it (Primary).
                        // This club becomes the Primary owner because it was synced first.
                        const { error: insertError } = await supabase
                            .from('events')
                            .insert({
                                club_id: club.id,
                                uid: uid,
                                title: title,
                                description: description,
                                location: location,
                                start_time: new Date(start).toISOString(),
                                end_time: new Date(end).toISOString(),
                                last_updated: new Date().toISOString(),
                                type_id: typeId,
                                requires_rsvp: rsvpInfo.required,
                                rsvp_link: rsvpInfo.link
                            });

                        if (insertError) console.error(`Failed to insert event ${uid}:`, insertError);
                        else processedCount++;
                    }
                }
            }
        }

        // 4. PRUNING: Remove events that are in DB for this club but NOT in the valid ICS feed
        // Only run this if we actually processed some events to avoid wiping DB on network error
        // But if processedCount is 0, it might mean the calendar is truly empty.
        // Let's rely on processedUids array.

        console.log(`Pruning Check: Found ${processedUids.length} events in feed.`);

        if (processedUids.length > 0) {
            const { data: dbEvents } = await supabase
                .from('events')
                .select('id, uid')
                .eq('club_id', club.id);

            if (dbEvents) {
                const uidsToDelete = dbEvents
                    .filter(e => !processedUids.includes(e.uid))
                    .map(e => e.id);

                if (uidsToDelete.length > 0) {
                    console.log(`Pruning ${uidsToDelete.length} stale events...`);
                    const { error: delErr } = await supabase
                        .from('events')
                        .delete()
                        .in('id', uidsToDelete);

                    if (delErr) console.error("Pruning failed:", delErr);
                    else console.log("Pruning complete.");
                } else {
                    console.log("No stale events to prune.");
                }
            }
        } else {
            console.log("Feed is empty. To be safe, skipping auto-prune to avoid accidental wipe. If you intend to clear all, use manual deletion.");
        }

        console.log(`Process complete. inserted/updated primary: ${processedCount}, collaborations: ${collabCount}`);

    } catch (error) {
        console.error('Error running population script:', error);
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
