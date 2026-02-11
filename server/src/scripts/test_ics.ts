
import app from '../index';
import { supabase } from '../db/supabase';
import http from 'http';

// Test Server Port
const TEST_PORT = 5555;

async function testIcsEndpoint() {
    // 1. Start Test Server
    const server = http.createServer(app);
    await new Promise<void>((resolve) => server.listen(TEST_PORT, resolve));
    console.log(`Test server running on port ${TEST_PORT}`);

    try {
        // 2. Get Valid Data for Filter
        const { data: result } = await supabase
            .from('events')
            .select('club_id, type_id')
            .limit(1)
            .single();

        if (!result) {
            console.warn("No events found to test with.");
            return;
        }

        const { club_id, type_id } = result;
        const filterStr = `${club_id}:${type_id}`;
        console.log(`Testing filter: ${filterStr}`);

        // 3. Request ICS
        const url = `http://localhost:${TEST_PORT}/events/ics?filters=${encodeURIComponent(filterStr)}`;
        const res = await fetch(url);

        if (res.status === 200) {
            const text = await res.text();
            console.log("\n--- Response Headers ---");
            console.log("Content-Type:", res.headers.get('content-type'));
            console.log("Content-Disposition:", res.headers.get('content-disposition'));

            console.log("\n--- ICS Content Preview (First 10 lines) ---");
            console.log(text.split('\n').slice(0, 10).join('\n'));

            if (text.includes("BEGIN:VCALENDAR") && text.includes("BEGIN:VEVENT")) {
                console.log("\n[PASS] Valid ICS format detected.");
            } else {
                console.error("\n[FAIL] Invalid ICS format.");
            }
        } else {
            console.error(`Request failed with status ${res.status}`);
            console.log(await res.text());
        }

    } catch (err) {
        console.error("Test failed:", err);
    } finally {
        server.close();
    }
}

testIcsEndpoint();
