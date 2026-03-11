import { supabase } from '../db/supabase';
import nodeIcal from 'node-ical';
import path from 'path';
import dotenv from 'dotenv';
import { Resend } from 'resend';

// Load env vars explicitly if running as script, though supabase.ts also does it.
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function buildCollabInviteEmail(recipientClubName: string, hostClubName: string, eventTitle: string, eventUrl: string): string {
    const collabUrl = `${eventUrl.split('/event/')[0]}/collab`;
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Collaboration Invite</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background-color:#004F35;padding:32px;text-align:center;">
              <img src="https://www.uomcc.org/assets/Looking%20Down.png" alt="" style="height:64px;width:64px;object-fit:contain;display:block;margin:0 auto 12px;" />
              <div style="color:#ffffff;font-size:20px;font-weight:600;">MCC Calendar Hub</div>
              <div style="color:rgba(255,255,255,0.7);font-size:12px;margin-top:4px;">University of Oregon Multicultural Center</div>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 32px;text-align:center;">
              <h2 style="margin:0 0 12px;font-size:22px;color:#111827;font-weight:600;">Collaboration Invite</h2>
              <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.6;">
                <strong style="color:#111827;">${hostClubName}</strong> has invited
                <strong style="color:#111827;">${recipientClubName}</strong> to collaborate on an upcoming event.
              </p>
              <div style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;margin-bottom:28px;text-align:left;">
                <div style="font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">Event</div>
                <div style="font-size:16px;font-weight:600;color:#111827;">${eventTitle}</div>
              </div>
              <a href="${collabUrl}" style="display:inline-block;background-color:#004F35;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;">
                Accept or Decline &rarr;
              </a>
              <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;line-height:1.6;">
                Once accepted, your club's badge will appear alongside the host on the event page.
                You can also <a href="${eventUrl}" style="color:#004F35;text-decoration:none;">view the event</a> directly.
              </p>
            </td>
          </tr>
          <tr>
            <td style="border-top:1px solid #e5e7eb;padding:20px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                MCC Calendar Hub &middot; University of Oregon<br>
                <a href="https://www.uomcc.org" style="color:#004F35;text-decoration:none;">uomcc.org</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function populate(clubName: string, icsUrl: string) {
    console.log(`Starting population for club: ${clubName}`);
    console.log(`Fetching ICS from: ${icsUrl}`);

    try {
        // 1. Look up club by ICS URL — never create or rename clubs during sync.
        //    If the club was deleted or doesn't have this ICS URL set, skip gracefully.
        const { data: club, error: clubError } = await supabase
            .from('clubs')
            .select('id, name')
            .eq('ics_source_url', icsUrl)
            .maybeSingle();

        if (clubError) {
            throw new Error(`Failed to look up club by ICS URL: ${clubError.message}`);
        }

        if (!club) {
            console.log(`[populate] No club found with ICS URL "${icsUrl}" — skipping.`);
            return;
        }

        console.log(`Club found: ${club.id} (${club.name})`);

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

        // 2. Pre-fetch email → club_id map for attendee matching
        const { data: userRoles } = await supabase
            .from('user_roles')
            .select('email, club_id');

        const emailToClubId: Record<string, string> = {};
        userRoles?.forEach(ur => {
            if (ur.email && ur.club_id) {
                emailToClubId[ur.email.toLowerCase()] = ur.club_id;
            }
        });

        // Reverse map: club_id → emails (for finding current club's PARTSTAT)
        const clubIdToEmails: Record<string, string[]> = {};
        userRoles?.forEach(ur => {
            if (ur.email && ur.club_id) {
                clubIdToEmails[ur.club_id] = clubIdToEmails[ur.club_id] ?? [];
                clubIdToEmails[ur.club_id].push(ur.email.toLowerCase());
            }
        });

        // Pre-fetch clubs for [collab: X] tag resolution (name and code lookup)
        const { data: allClubs } = await supabase
            .from('clubs')
            .select('id, name, metadata_tags');

        const clubNameToId: Record<string, string> = {};
        const clubCodeToId: Record<string, string> = {};
        allClubs?.forEach((c: any) => {
            clubNameToId[c.name.toLowerCase()] = c.id;
            const code = c.metadata_tags?.collab_code;
            if (code) clubCodeToId[(code as string).toLowerCase()] = c.id;
        });

        const parseAttendees = (evt: any): Array<{ email: string; partstat: string }> => {
            const raw = evt.attendee;
            if (!raw) return [];
            const list = Array.isArray(raw) ? raw : [raw];
            return list.map((att: any) => {
                const val = typeof att === 'string' ? att : (att.val ?? '');
                const email = val.replace(/^mailto:/i, '').toLowerCase().trim();
                const partstat = ((att.params?.PARTSTAT) ?? 'NEEDS-ACTION').toString().toUpperCase();
                return { email, partstat };
            }).filter(a => a.email);
        };

        const upsertAttendeeCollabs = async (eventId: string, attendees: Array<{ email: string; partstat: string }>, eventTitle: string, hostClubName: string) => {
            for (const att of attendees) {
                const attClubId = emailToClubId[att.email];
                if (!attClubId || attClubId === club.id) continue;
                const status = att.partstat === 'ACCEPTED' ? 'accepted' : 'pending';
                // Check if record already exists — preserves any manually-set accept/reject status
                const { data: existing } = await supabase
                    .from('collaborations')
                    .select('id')
                    .eq('event_id', eventId)
                    .eq('club_id', attClubId)
                    .maybeSingle();
                if (!existing) {
                    const { error: ce } = await supabase
                        .from('collaborations')
                        .insert({ event_id: eventId, club_id: attClubId, role: 'secondary', status });
                    if (ce) console.error(`Failed to insert attendee collab:`, ce);
                    else {
                        collabCount++;
                        if (status === 'pending') {
                            const targetName = allClubs?.find((c: any) => c.id === attClubId)?.name ?? att.email;
                            await sendCollabInviteEmail(attClubId, targetName, eventTitle, hostClubName, eventId);
                        }
                    }
                }
            }
        };

        // Parse [collab: X] or [c: X] tags from description text.
        // X may be a club name, short collab code, or email address.
        const parseCollabTags = (text: string): string[] => {
            const matches = [...text.matchAll(/\[(?:collab|c):\s*([^\]]+)\]/gi)];
            return matches.map(m => m[1].trim()).filter(Boolean);
        };

        // Resolve a tag value to a club_id. Priority: name → collab code → email.
        const resolveCollabTag = (tag: string): string | null => {
            const lower = tag.toLowerCase();
            return clubNameToId[lower] ?? clubCodeToId[lower] ?? emailToClubId[lower] ?? null;
        };

        const sendCollabInviteEmail = async (
            targetClubId: string,
            targetClubName: string,
            eventTitle: string,
            hostClubName: string,
            eventId: string,
        ) => {
            if (!process.env.RESEND_API_KEY) return;
            const adminEmails = clubIdToEmails[targetClubId] ?? [];
            if (adminEmails.length === 0) return;
            const frontendUrl = process.env.FRONTEND_URL ?? 'https://mcc.uomcc.org';
            const eventUrl = `${frontendUrl}/event/${eventId}`;
            try {
                const resend = new Resend(process.env.RESEND_API_KEY);
                await resend.emails.send({
                    from: process.env.SMTP_FROM ?? 'MCC Calendar Hub <noreply@uomcc.org>',
                    to: adminEmails[0],
                    subject: `[MCC] Collaboration invite: ${eventTitle}`,
                    html: buildCollabInviteEmail(targetClubName, hostClubName, eventTitle, eventUrl),
                });
                console.log(`Sent collab invite email to ${adminEmails[0]} for "${eventTitle}"`);
            } catch (err: any) {
                console.error(`Failed to send collab invite email to ${adminEmails[0]}:`, err.message);
            }
        };

        // Create collab records from [collab: X] tags. Only inserts if no record
        // already exists — preserves any manually-set accept/reject status.
        // Sends an email notification to the target club's admin on first detection.
        const upsertCollabTagCollabs = async (eventId: string, tags: string[], eventTitle: string) => {
            for (const tag of tags) {
                const targetClubId = resolveCollabTag(tag);
                if (!targetClubId || targetClubId === club.id) {
                    if (!targetClubId) console.warn(`[collab tag] No club found for "${tag}" — skipping`);
                    continue;
                }
                const { data: existing } = await supabase
                    .from('collaborations')
                    .select('id')
                    .eq('event_id', eventId)
                    .eq('club_id', targetClubId)
                    .maybeSingle();
                if (!existing) {
                    const { error } = await supabase.from('collaborations').insert({
                        event_id: eventId,
                        club_id: targetClubId,
                        role: 'secondary',
                        status: 'pending',
                    });
                    if (error) {
                        console.error(`Failed to create tag-based collab for "${tag}":`, error);
                    } else {
                        collabCount++;
                        const targetName = allClubs?.find((c: any) => c.id === targetClubId)?.name ?? tag;
                        await sendCollabInviteEmail(targetClubId, targetName, eventTitle, club.name, eventId);
                    }
                }
            }
        };

        // 3. Fetch and Parse ICS
        const events = await nodeIcal.async.fromURL(icsUrl);

        // 4. Process Events
        let processedCount = 0;
        let collabCount = 0;

        // Helpers for classification
        const classifyEvent = (title: string, desc: string): string | null => {
            const text = (title + " " + desc).toLowerCase();

            // Bracketed tags take priority
            if (text.includes("[event]") || text.includes("[e]")) return getTypeId("Events");
            if (text.includes("[meeting]") || text.includes("[m]")) return getTypeId("Meetings");
            if (text.includes("[office hours]") || text.includes("[oh]")) return getTypeId("Office Hours");
            if (text.includes("[other]") || text.includes("[o]")) return getTypeId("Other");

            // Plain keyword fallback — check "office hours" before "meeting" (more specific)
            if (text.includes("office hours")) return getTypeId("Office Hours");
            if (text.includes("meeting")) return getTypeId("Meetings");

            // Default
            return getTypeId("Other");
        };

        // Strip Microsoft Teams meeting boilerplate from descriptions.
        // Preserves the bare join URL and removes the multi-paragraph invite text.
        const cleanDescription = (desc: string): string => {
            // Match the separator line (underscores) or "Microsoft Teams meeting" header
            const teamsStart = desc.search(
                /_{5,}|Microsoft Teams meeting|Join Microsoft Teams Meeting/i
            );
            if (teamsStart === -1) return desc;

            const before = desc.slice(0, teamsStart).trim();
            const teamsBlock = desc.slice(teamsStart);

            // Try to preserve the actual join URL
            const joinUrlMatch = teamsBlock.match(
                /https:\/\/teams\.microsoft\.com\/l\/meetup-join\/[^\s<>"]+/i
            );
            const suffix = joinUrlMatch
                ? ` [Teams: ${joinUrlMatch[0]}]`
                : ' [Teams meeting — link in original calendar]';

            return (before + suffix).trim();
        };

        const checkRsvp = (title: string, desc: string): { required: boolean, link: string | null } => {
            const titleText = title.toLowerCase();
            const descText = desc.toLowerCase();

            // Ticket/RSVP detection
            const hasTicketTag =
                titleText.includes('[t]') || titleText.includes('[ticket]') ||
                descText.includes('[t]') || descText.includes('[ticket]');
            const hasTicketWord = /\btickets?\b/.test(descText);
            const hasRsvpWord = descText.includes('rsvp') || descText.includes('register');

            const required = hasTicketTag || hasTicketWord || hasRsvpWord;

            let link = null;
            if (required) {
                // Prefer non-Teams URLs as the RSVP link
                const urlRegex = /(https?:\/\/[^\s<>"]+)/g;
                const matches = [...desc.matchAll(urlRegex)].map(m => m[1]);
                link = matches.find(u => !u.includes('teams.microsoft.com')) ?? null;
            }
            return { required, link };
        };

        const processedUids: string[] = [];

        for (const key in events) {
            if (events.hasOwnProperty(key)) {
                const event = events[key] as any;
                if (event.type === 'VEVENT') {
                    // Robust date handling
                    const start = event.start;
                    const end = event.end;

                    if (!start || !end) {
                        console.warn(`Skipping event ${event.uid} due to missing start/end time`);
                        continue;
                    }

                    const rawTitle = event.summary || 'Untitled Event';
                    // Strip all known MCC shortcode tags from anywhere in the title
                    // (they may appear at start, end, or multiple times, with or without spaces)
                    const title = rawTitle
                      .replace(/\[(?:e|event|m|meeting|oh|office\s*hours|o|other|t|ticket)\]\s*/gi, '')
                      .replace(/\[(?:collab|c):\s*[^\]]+\]\s*/gi, '')
                      .trim();
                    const rawDescription = event.description || '';
                    // Parse collab tags from both title and description
                    const collabTags = [...new Set([...parseCollabTags(rawTitle), ...parseCollabTags(rawDescription)])];
                    const description = cleanDescription(rawDescription)
                        .replace(/\[(?:collab|c):\s*[^\]]+\]/gi, '')
                        .trim();
                    const location = event.location || '';
                    const typeId = classifyEvent(rawTitle, description);
                    const rsvpInfo = checkRsvp(rawTitle, description);
                    const uid = event.uid; // ICS UID

                    processedUids.push(uid);

                    // DUPLICATE & COLLABORATION LOGIC

                    // Check if event with this UID already exists (globally)
                    // This handles "duplicate events flagged" by UID.
                    const { data: existingEvents, error: fetchError } = await supabase
                        .from('events')
                        .select('id, club_id, manually_edited')
                        .eq('uid', uid);

                    if (fetchError) {
                        console.error(`Error checking existence for ${uid}:`, fetchError);
                        continue;
                    }

                    const existingEvent = existingEvents && existingEvents.length > 0 ? existingEvents[0] : null;

                    const attendees = parseAttendees(event);

                    if (existingEvent) {
                        // Event exists!
                        if (existingEvent.club_id === club.id) {
                            // It belongs to THIS club (Primary). Update it.
                            // If an admin has manually edited this event, all fields are frozen —
                            // only last_updated is refreshed so we know the sync ran.
                            if (existingEvent.manually_edited) {
                                await supabase
                                    .from('events')
                                    .update({ last_updated: new Date().toISOString() })
                                    .eq('id', existingEvent.id);
                            } else {
                                const syncPayload: Record<string, any> = {
                                    title,
                                    description,
                                    location,
                                    type_id: typeId,
                                    start_time: new Date(start).toISOString(),
                                    end_time: new Date(end).toISOString(),
                                    last_updated: new Date().toISOString(),
                                    requires_rsvp: rsvpInfo.required,
                                    rsvp_link: rsvpInfo.link,
                                };
                                const { error: updateError } = await supabase
                                    .from('events')
                                    .update(syncPayload)
                                    .eq('id', existingEvent.id);
                                if (updateError) console.error(`Failed to update event ${uid}:`, updateError);
                            }
                            processedCount++;
                            await upsertAttendeeCollabs(existingEvent.id, attendees, title, club.name);
                            await upsertCollabTagCollabs(existingEvent.id, collabTags, title);

                        } else {
                            // It belongs to ANOTHER club. This is a COLLABORATION.
                            // ignoreDuplicates: true — never flip a status the club admin has set.
                            const myEmails = clubIdToEmails[club.id] ?? [];
                            const myAttendee = attendees.find(a => myEmails.includes(a.email));
                            const status = myAttendee?.partstat === 'ACCEPTED' ? 'accepted' : 'pending';

                            const { error: collabError } = await supabase
                                .from('collaborations')
                                .upsert({
                                    event_id: existingEvent.id,
                                    club_id: club.id,
                                    role: 'secondary',
                                    status,
                                }, { onConflict: 'event_id,club_id', ignoreDuplicates: true });

                            if (collabError) console.error(`Failed to add collaboration for ${uid}:`, collabError);
                            else collabCount++;
                        }
                    } else {
                        // Event does not exist. Create it (Primary).
                        // This club becomes the Primary owner because it was synced first.
                        const { data: newEvent, error: insertError } = await supabase
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
                            })
                            .select('id')
                            .single();

                        if (insertError) console.error(`Failed to insert event ${uid}:`, insertError);
                        else {
                            processedCount++;
                            // Process attendees and [collab: X] tags so invited clubs get collaboration records
                            await upsertAttendeeCollabs(newEvent.id, attendees, title, club.name);
                            await upsertCollabTagCollabs(newEvent.id, collabTags, title);
                        }
                    }
                }
            }
        }

        // 5. PRUNING: Remove events that are in DB for this club but NOT in the valid ICS feed
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
