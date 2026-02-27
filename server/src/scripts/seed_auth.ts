/**
 * seed_auth.ts
 *
 * Creates Supabase Auth accounts for the MCC root admin and every club in the
 * clubs table, then inserts the corresponding user_roles rows.
 *
 * Usage:
 *   cd server
 *   npx ts-node -r tsconfig-paths/register src/scripts/seed_auth.ts
 *
 * Idempotent: skips users whose email already exists in auth.users.
 */

import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { supabase } from '../db/supabase';

const ROOT_EMAIL = 'mcc@uoregon.edu';
const ROOT_PASSWORD = 'password123';
const DEFAULT_CLUB_PASSWORD = 'clubadmin123';

async function createAuthUser(email: string, password: string, name: string) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // skip email verification
    user_metadata: { name },
  });

  if (error) {
    // "User already registered" is not fatal — retrieve the existing user
    if (error.message?.includes('already')) {
      const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) throw listError;
      const existing = users.find(u => u.email === email);
      if (existing) return existing;
    }
    throw error;
  }

  return data.user;
}

async function seedAuth() {
  console.log('--- Seeding Authentication Data ---');

  // ── 1. Root admin ─────────────────────────────────────────────────────────
  console.log(`\nCreating root admin: ${ROOT_EMAIL}`);
  const rootUser = await createAuthUser(ROOT_EMAIL, ROOT_PASSWORD, 'MCC Admin');

  const { error: rootRoleError } = await supabase
    .from('user_roles')
    .upsert(
      { user_id: rootUser.id, email: ROOT_EMAIL, role: 'root', club_id: null, raw_password: ROOT_PASSWORD },
      { onConflict: 'user_id' }
    );
  if (rootRoleError) console.error('  ✗ Failed to upsert root user_role:', rootRoleError);
  else console.log(`  ✓ Root admin provisioned (id: ${rootUser.id})`);

  // ── 2. Club admins ────────────────────────────────────────────────────────
  const { data: clubs, error: clubsError } = await supabase
    .from('clubs')
    .select('id, name')
    .order('name', { ascending: true });

  if (clubsError) throw clubsError;
  console.log(`\nProvisioning accounts for ${clubs.length} clubs…`);

  for (const club of clubs) {
    // Derive a deterministic email from the club name:
    //   "Black Student Union" → "bsu@uoregon.edu" (first letters of each word, lower-cased)
    const slug = club.name
      .split(/\s+/)
      .map((w: string) => w[0])
      .join('')
      .toLowerCase();
    const email = `${slug}@uoregon.edu`;

    try {
      const clubUser = await createAuthUser(email, DEFAULT_CLUB_PASSWORD, club.name);
      const { error: clubRoleError } = await supabase
        .from('user_roles')
        .upsert(
          { user_id: clubUser.id, email, role: 'club_admin', club_id: club.id, raw_password: DEFAULT_CLUB_PASSWORD },
          { onConflict: 'user_id' }
        );
      if (clubRoleError) console.error(`  ✗ user_role upsert failed for ${club.name}:`, clubRoleError);
      else console.log(`  ✓ ${club.name.padEnd(40)} ${email}`);
    } catch (err: any) {
      console.error(`  ✗ ${club.name}: ${err.message}`);
    }
  }

  console.log('\n--- Done ---');
  console.log(`Root admin:  ${ROOT_EMAIL} / ${ROOT_PASSWORD}`);
  console.log(`Club admins: <slug>@uoregon.edu / ${DEFAULT_CLUB_PASSWORD}`);
}

seedAuth().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
