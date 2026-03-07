/**
 * @file index.ts
 * @description Express REST API entry point for MCC Calendar Hub backend.
 *
 * ## Architecture
 * ```
 * Express app (port 4000 / $PORT)
 *   ├── CORS: ALLOWED_ORIGINS env var + dynamic Vercel preview URLs
 *   ├── Body parser: JSON up to 8mb (for base64 logo payloads)
 *   ├── In-memory cache (TTL from CACHE_TTL_SECONDS) via cache.ts
 *   ├── Auth middleware (middleware/auth.ts): JWT validation via Supabase
 *   └── Routes (see sections below)
 * ```
 *
 * ## Route Summary
 *
 * ### Public
 * - `GET /clubs`              → cached list of all clubs
 * - `GET /events`             → cached list of all events with collaborators
 * - `GET /events/ics`         → ICS calendar file (filtered by ?filters=clubId:typeId,...)
 * - `GET /event-types`        → list of event type categories
 * - `GET /site-settings/:key` → CMS block content (About page, etc.)
 *
 * ### Auth (requireAuth — any valid JWT)
 * - `POST /auth/login`        → returns JWT + user info
 * - `GET  /auth/me`           → validates token, returns user
 * - `POST /auth/forgot-password`    → triggers Supabase reset email
 * - `POST /auth/reset-password`     → validates token, updates password
 * - `POST /auth/request-account`    → inserts account_requests row
 * - `POST /auth/change-email`       → sends HMAC confirmation link to new email
 * - `POST /auth/confirm-email`      → validates confirmation token, applies change
 * - `POST /auth/change-password`    → verifies current pw, updates in Supabase + user_roles
 * - `PATCH /events/:id`       → edit event (root: any; club_admin: own only)
 * - `DELETE /events/:id`      → delete event (same scope)
 * - `POST /events`            → create event
 * - `POST /events/:id/collaborators` → add collaborating club
 * - `DELETE /events/:id/collaborators/:clubId` → remove collaborating club
 * - `PATCH /clubs/:id`        → edit club info (root: any; club_admin: own only)
 * - `POST /clubs/:id/logo`    → upload club logo to Supabase Storage
 * - `GET /collab`             → collaborations for current user's club
 * - `PATCH /collab/:id`       → accept or reject a collaboration
 *
 * ### Admin (requireRoot — DB role 'root')
 * - `GET  /admin/users`       → list all club_admin accounts
 * - `POST /admin/passwords/:userId` → force-set club admin password
 * - `GET  /admin/requests`    → list account requests
 * - `POST /admin/requests/:id/approve` → approve + create club + send credentials email
 * - `POST /admin/requests/:id/reject`  → mark rejected
 * - `DELETE /admin/requests`  → clear processed request history
 * - `PATCH /admin/clubs/:id/email` → immediately change club admin email
 * - `POST  /admin/users/:userId/email` → alias (ChangePassword.tsx "Change Email" for root)
 * - `POST /clubs`             → create new club
 * - `DELETE /clubs/:id`       → delete club + cascade events + user_roles
 * - `POST /event-types`       → create event type
 * - `PATCH /event-types/:id`  → rename event type
 * - `DELETE /event-types/:id` → delete event type
 * - `PUT  /site-settings/:key`        → upsert CMS block content
 * - `POST /site-settings/upload`      → upload media to mcc-public-assets bucket
 *
 * ### Internal (x-sync-secret header, no JWT)
 * - `POST /internal/cache/clear` → clears all cached responses (called by sync cron)
 *
 * ## Caching Strategy
 * GET /clubs, GET /events, GET /event-types are cached in memory.
 * Any mutation on those resources calls clearCacheKey() or clearAllCache().
 * The sync cron also posts to /internal/cache/clear after each sync run.
 */
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { supabase } from './db/supabase';
import { getFromCache, setInCache, clearCacheKey, clearAllCache } from './cache';
import { requireAuth, requireRoot, AuthenticatedRequest } from './middleware/auth';
import { startCron, triggerSync, getSyncHistory, getCronSchedule } from './cron';
import { log, requestLogger, getLogBuffer } from './logger';
import { getCacheStatus } from './cache';

// ---------------------------------------------------------------------------
// Password reset — generates a token_hash via admin API, sends branded email
// via SMTP. Bypasses Supabase's built-in email (avoids PKCE redirect issues).
// ---------------------------------------------------------------------------
async function sendPasswordReset(email: string) {
  const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';

  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo: `${frontendUrl}/reset-password` },
  });

  if (error || !data?.properties?.hashed_token) {
    log.error(`sendPasswordReset generateLink failed for ${email} — ${error?.message}`);
    return;
  }

  const resetUrl = `${frontendUrl}/reset-password?token_hash=${data.properties.hashed_token}&type=recovery`;

  if (!process.env.RESEND_API_KEY) {
    log.warn(`RESEND_API_KEY not configured — skipping password reset email for ${email}`);
    return;
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: process.env.SMTP_FROM ?? 'MCC Calendar Hub <noreply@uomcc.org>',
      to: email,
      subject: 'Reset your MCC Calendar Hub password',
      html: buildResetEmail(resetUrl),
    });
    if (error) log.error(`sendPasswordReset email send failed for ${email} — ${error.message}`);
  } catch (err: any) {
    log.error(`sendPasswordReset email send failed for ${email} — ${err.message}`);
  }
}

function buildResetEmail(resetUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your password</title>
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
              <h2 style="margin:0 0 12px;font-size:22px;color:#111827;font-weight:600;">Reset Your Password</h2>
              <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.6;">
                We received a request to reset the password for your account.
                Click the button below to choose a new password. This link expires in 24&nbsp;hours.
              </p>
              <a href="${resetUrl}" style="display:inline-block;background-color:#004F35;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;">
                Reset Password
              </a>
              <p style="margin:28px 0 0;font-size:13px;color:#9ca3af;line-height:1.6;">
                If you didn't request a password reset, you can safely ignore this email — your password won't change.
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

// Creates a throwaway Supabase client for signInWithPassword so the shared
// service-role client's session is never polluted by user auth state.
function makeAuthClient() {
  return createClient(
    process.env.SUPABASE_URL ?? '',
    process.env.SUPABASE_KEY ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}


const app = express();
const PORT = process.env.PORT || 4000;

// ---------------------------------------------------------------------------
// CORS — allow only the origins listed in ALLOWED_ORIGINS (comma-separated).
// Falls back to localhost:5173 for local development.
// ---------------------------------------------------------------------------
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like curl requests)
    if (!origin) return callback(null, true);

    // Exact match from ALLOWED_ORIGINS
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Dynamic Vercel preview branch/PR deployments
    if (
      origin.startsWith('https://mcc-scheduler-') &&
      origin.endsWith('.vercel.app')
    ) {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json({ limit: '8mb' })); // increased for base64 logo uploads
app.use(requestLogger);

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Auth — all routes proxy through to Supabase Auth so the service key never
// leaves the server.
// ---------------------------------------------------------------------------

// POST /auth/login  { email, password }
// Returns { token, user: { id, name, email, role, clubId } }
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'invalid email format' });
  }

  const { data, error } = await makeAuthClient().auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    return res.status(401).json({ error: error?.message ?? 'Login failed' });
  }

  // Fetch role from user_roles table
  const { data: roleRow, error: roleError } = await supabase
    .from('user_roles')
    .select('role, club_id')
    .eq('user_id', data.user.id)
    .single();

  if (roleError || !roleRow) {
    return res.status(403).json({ error: 'No admin role assigned to this account' });
  }

  // Map DB roles → frontend roles
  const roleMap: Record<string, 'admin' | 'club_officer'> = {
    root: 'admin',
    club_admin: 'club_officer',
  };

  return res.json({
    token: data.session.access_token,
    user: {
      id: data.user.id,
      name: data.user.user_metadata?.name ?? email.split('@')[0],
      email: data.user.email,
      role: roleMap[roleRow.role] ?? 'club_officer',
      clubId: roleRow.club_id ?? null,
    },
  });
});

// GET /auth/me — validate a stored token and return the user
app.get('/auth/me', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { data: roleRow } = await supabase
    .from('user_roles')
    .select('role, club_id')
    .eq('user_id', req.userId)
    .single();

  if (!roleRow) return res.status(403).json({ error: 'No role found' });

  const { data: userData } = await supabase.auth.admin.getUserById(req.userId!);

  const roleMap: Record<string, 'admin' | 'club_officer'> = {
    root: 'admin',
    club_admin: 'club_officer',
  };

  return res.json({
    id: req.userId,
    name: userData?.user?.user_metadata?.name ?? userData?.user?.email?.split('@')[0] ?? req.userId,
    email: userData?.user?.email,
    role: roleMap[roleRow.role] ?? 'club_officer',
    clubId: roleRow.club_id ?? null,
  });
});

// POST /auth/logout — stateless JWT, so just acknowledge; client clears state.
app.post('/auth/logout', (_req, res) => {
  res.json({ status: 'ok' });
});

// POST /auth/forgot-password  { email }
app.post('/auth/forgot-password', async (req, res) => {
  const { email } = req.body as { email?: string };
  if (!email) return res.status(400).json({ error: 'email is required' });

  // Respond immediately — never leak whether the email exists, and don't block on SMTP.
  res.json({ status: 'ok' });
  sendPasswordReset(email.trim().toLowerCase()).catch(err =>
    log.error(`sendPasswordReset failed for ${email}: ${err.message}`)
  );
});

// POST /auth/reset-password  { token, tokenType, newPassword }
// Validates the recovery token from the email link and updates the password.
// tokenType: 'access_token' (implicit flow, from URL hash) | 'token_hash' (PKCE flow, from query string)
app.post('/auth/reset-password', async (req, res) => {
  const { token, tokenType = 'access_token', newPassword } = req.body as {
    token?: string;
    tokenType?: 'access_token' | 'token_hash';
    newPassword?: string;
  };
  if (!token || !newPassword) {
    return res.status(400).json({ error: 'token and newPassword are required' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  let userId: string;

  if (tokenType === 'token_hash') {
    // PKCE flow: exchange token_hash for a session to verify identity
    const { data, error: otpError } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'recovery',
    });
    if (otpError || !data.user) {
      return res.status(401).json({ error: 'Invalid or expired reset token' });
    }
    userId = data.user.id;
  } else {
    // Implicit flow: access_token directly from URL hash
    const { data: { user }, error: tokenError } = await supabase.auth.getUser(token);
    if (tokenError || !user) {
      return res.status(401).json({ error: 'Invalid or expired reset token' });
    }
    userId = user.id;
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
    password: newPassword,
  });
  if (updateError) return res.status(500).json({ error: updateError.message });

  res.json({ status: 'ok' });
});

// POST /auth/change-password  { currentPassword, newPassword }
// Requires a valid JWT. Verifies the current password then updates to the new one.
app.post('/auth/change-password', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { currentPassword, newPassword } = req.body as {
    currentPassword?: string;
    newPassword?: string;
  };
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'currentPassword and newPassword are required' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters' });
  }
  if (currentPassword === newPassword) {
    return res.status(400).json({ error: 'New password must differ from the current one' });
  }

  const userId = req.userId!;
  const email = req.userEmail!;

  // Verify the current password by attempting a sign-in
  const { error: signInErr } = await makeAuthClient().auth.signInWithPassword({
    email,
    password: currentPassword,
  });
  if (signInErr) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }

  // Update password via admin API
  const { error: updateErr } = await supabase.auth.admin.updateUserById(userId, {
    password: newPassword,
  });
  if (updateErr) return res.status(500).json({ error: updateErr.message });

  // Persist plaintext for admin visibility (best-effort)
  await supabase.from('user_roles').update({ raw_password: newPassword }).eq('user_id', userId);

  res.json({ status: 'ok' });
});

// POST /auth/change-email  { newEmail }
// Immediately updates the email and sends a Supabase password reset to the new address.
app.post('/auth/change-email', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { newEmail } = req.body as { newEmail?: string };
  if (!newEmail?.trim()) return res.status(400).json({ error: 'newEmail is required' });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(newEmail.trim())) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  const userId = req.userId!;
  const normalizedNew = newEmail.trim().toLowerCase();

  const { error } = await supabase.auth.admin.updateUserById(userId, {
    email: normalizedNew,
    email_confirm: true,
  });
  if (error) return res.status(500).json({ error: error.message });

  await supabase.from('user_roles').update({ email: normalizedNew }).eq('user_id', userId);
  await sendPasswordReset(normalizedNew);

  res.json({ status: 'ok' });
});

// POST /auth/confirm-email — no longer used; kept as a stub for backwards compatibility.
app.post('/auth/confirm-email', (_req, res) => {
  res.json({ status: 'ok' });
});


// ---------------------------------------------------------------------------
// GET / — Server status dashboard (HTML)
// GET /status?secret=SYNC_SECRET — JSON status data
// POST /admin/sync?secret=SYNC_SECRET — manually trigger ICS sync
// ---------------------------------------------------------------------------
const SERVER_START = new Date().toISOString();

app.get('/status', (_req, res) => {
  res.json({
    serverStart: SERVER_START,
    uptime: Math.floor(process.uptime()),
    cronSchedule: getCronSchedule(),
    cache: getCacheStatus(),
    syncHistory: getSyncHistory(),
    log: getLogBuffer().slice(-100),
  });
});

app.post('/admin/sync', async (req, res) => {
  const secret = (req.query.secret ?? req.headers['x-sync-secret']) as string | undefined;
  if (!secret || secret !== process.env.SYNC_SECRET) {
    return res.status(401).json({ error: 'Invalid or missing secret' });
  }
  res.json({ status: 'started' });
  triggerSync().catch(err => log.error(`Manual sync failed: ${err.message}`));
});

app.get('/', (_req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>MCC API Console</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  :root{--green:#004F35;--green-light:#006644;--bg:#0d1117;--surface:#161b22;--border:#30363d;--text:#e6edf3;--muted:#8b949e;--red:#f85149;--yellow:#d29922;--blue:#58a6ff;--teal:#39d353}
  body{background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;font-size:14px;min-height:100vh}
  header{background:var(--green);padding:16px 24px;display:flex;align-items:center;gap:16px;border-bottom:1px solid rgba(255,255,255,0.1)}
  header img{height:40px;width:40px;object-fit:contain;border-radius:6px}
  header h1{font-size:18px;font-weight:600;color:#fff}
  header p{font-size:12px;color:rgba(255,255,255,0.65);margin-top:2px}
  .header-right{margin-left:auto;display:flex;align-items:center;gap:12px}
  #uptime{font-size:12px;color:rgba(255,255,255,0.6);font-variant-numeric:tabular-nums}
  main{padding:24px;max-width:1400px;margin:0 auto;display:grid;gap:20px;grid-template-columns:1fr 1fr}
  .full{grid-column:1/-1}
  .card{background:var(--surface);border:1px solid var(--border);border-radius:10px;overflow:hidden}
  .card-header{padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between}
  .card-header h2{font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--muted)}
  .card-body{padding:18px}
  .stat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px}
  .stat{background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:14px}
  .stat-label{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px}
  .stat-value{font-size:22px;font-weight:600;font-variant-numeric:tabular-nums}
  .ok{color:var(--teal)} .err{color:var(--red)} .warn{color:var(--yellow)} .info{color:var(--blue)} .muted{color:var(--muted)}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th{text-align:left;padding:8px 12px;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);border-bottom:1px solid var(--border)}
  td{padding:8px 12px;border-bottom:1px solid rgba(48,54,61,0.5);vertical-align:top}
  tr:last-child td{border-bottom:none}
  .badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600}
  .badge-ok{background:rgba(57,211,83,0.15);color:var(--teal)}
  .badge-err{background:rgba(248,81,73,0.15);color:var(--red)}
  .badge-warn{background:rgba(210,153,34,0.15);color:var(--yellow)}
  .badge-info{background:rgba(88,166,255,0.15);color:var(--blue)}
  .badge-http{background:rgba(139,148,158,0.15);color:var(--muted)}
  pre.log{background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:14px;font-family:'SF Mono','Cascadia Code',Consolas,monospace;font-size:12px;line-height:1.6;overflow-x:auto;max-height:400px;overflow-y:auto;white-space:pre-wrap;word-break:break-all}
  .log-info{color:var(--blue)} .log-success{color:var(--teal)} .log-warn{color:var(--yellow)}
  .log-error{color:var(--red)} .log-cron{color:#c9d1d9} .log-auth{color:#79c0ff}
  .log-http{color:var(--muted)} .log-cache{color:#6e7681}
  .sync-btn{background:var(--green);color:#fff;border:none;border-radius:6px;padding:7px 14px;font-size:13px;font-weight:500;cursor:pointer}
  .sync-btn:hover{background:var(--green-light)}
  .sync-btn:disabled{opacity:.5;cursor:not-allowed}
  .locked{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px;gap:12px;color:var(--muted);text-align:center}
  .locked svg{opacity:.4}
  .dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px}
  .dot-ok{background:var(--teal)} .dot-err{background:var(--red)}
  #last-updated{font-size:11px;color:var(--muted)}
  .cache-tag{display:inline-block;background:var(--bg);border:1px solid var(--border);border-radius:4px;padding:2px 8px;font-family:monospace;font-size:12px;margin:2px}
</style>
</head>
<body>
<header>
  <img src="https://www.uomcc.org/assets/Waving.png" alt="">
  <div>
    <h1>MCC API Console</h1>
    <p>api.uomcc.org &nbsp;·&nbsp; University of Oregon Multicultural Center</p>
  </div>
  <div class="header-right">
    <span id="uptime"></span>
  </div>
</header>
<main id="main">
  <div class="full" style="padding:40px;text-align:center;color:var(--muted)">Loading…</div>
</main>

<script>
let data = null;
let pollTimer = null;

fetchStatus();

async function fetchStatus() {
  try {
    const r = await fetch('/status');
    if (!r.ok) return;
    data = await r.json();
    render(data);
    const el = document.getElementById('last-updated');
    if (el) el.textContent = 'Updated ' + new Date().toLocaleTimeString();
  } catch(e) {}
  clearTimeout(pollTimer);
  pollTimer = setTimeout(fetchStatus, 5000);
}

function fmt(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'});
}

function ago(iso) {
  if (!iso) return '—';
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return s + 's ago';
  if (s < 3600) return Math.floor(s/60) + 'm ago';
  return Math.floor(s/3600) + 'h ago';
}

function levelBadge(level) {
  const map = {info:'info',success:'ok',warn:'warn',error:'err',cron:'info',auth:'info',http:'http',cache:'http'};
  return '<span class="badge badge-' + (map[level]||'http') + '">' + level + '</span>';
}

function render(d) {
  const last = d.syncHistory.length ? d.syncHistory[d.syncHistory.length-1] : null;
  const totalSyncs = d.syncHistory.length;
  const totalOk = d.syncHistory.reduce((a,s) => a+s.succeeded, 0);
  const totalFail = d.syncHistory.reduce((a,s) => a+s.failed, 0);

  document.getElementById('main').innerHTML = \`
    <!-- Stats row -->
    <div class="full card">
      <div class="card-header">
        <h2>Server</h2>
        <span id="last-updated" class="muted"></span>
      </div>
      <div class="card-body">
        <div class="stat-grid">
          <div class="stat">
            <div class="stat-label">Status</div>
            <div class="stat-value ok"><span class="dot dot-ok"></span>Online</div>
          </div>
          <div class="stat">
            <div class="stat-label">Uptime</div>
            <div class="stat-value" id="uptime-card">—</div>
          </div>
          <div class="stat">
            <div class="stat-label">Started</div>
            <div class="stat-value muted" style="font-size:13px;padding-top:4px">\${fmt(d.serverStart)}</div>
          </div>
          <div class="stat">
            <div class="stat-label">Cron Schedule</div>
            <div class="stat-value muted" style="font-size:14px;font-family:monospace;padding-top:4px">\${d.cronSchedule}</div>
          </div>
          <div class="stat">
            <div class="stat-label">Last Sync</div>
            <div class="stat-value \${last && last.failed===0?'ok':last?'warn':'muted'}" style="font-size:14px;padding-top:4px">\${last ? ago(last.completedAt) : 'None'}</div>
          </div>
          <div class="stat">
            <div class="stat-label">Syncs (session)</div>
            <div class="stat-value">\${totalSyncs}</div>
          </div>
          <div class="stat">
            <div class="stat-label">Events Synced</div>
            <div class="stat-value ok">\${totalOk}</div>
          </div>
          <div class="stat">
            <div class="stat-label">Sync Errors</div>
            <div class="stat-value \${totalFail>0?'err':'muted'}">\${totalFail}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Sync history + Cache -->
    <div class="card">
      <div class="card-header">
        <h2>Sync History</h2>
        <button class="sync-btn" id="sync-btn" onclick="triggerSync()">▶ Run Now</button>
      </div>
      <div class="card-body" style="padding:0">
        \${d.syncHistory.length === 0
          ? '<p style="padding:18px;color:var(--muted)">No syncs yet this session.</p>'
          : '<table><thead><tr><th>Time</th><th>Duration</th><th>OK</th><th>Failed</th><th>Clubs</th></tr></thead><tbody>'
            + [...d.syncHistory].reverse().map(s => \`
              <tr>
                <td style="white-space:nowrap">\${fmt(s.completedAt)}</td>
                <td class="muted">\${s.durationMs}ms</td>
                <td class="ok">\${s.succeeded}</td>
                <td class="\${s.failed>0?'err':'muted'}">\${s.failed}</td>
                <td>\${s.clubs.map(c => '<span title="'+(c.error||'')+'" class="cache-tag \${c.status==="ok"?"ok":"err"}">'+ c.name +'</span>').join('')}</td>
              </tr>\`).join('')
            + '</tbody></table>'}
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h2>Cache</h2></div>
      <div class="card-body">
        \${d.cache.length === 0
          ? '<p class="muted">Cache is empty.</p>'
          : '<table><thead><tr><th>Key</th><th>Expires in</th></tr></thead><tbody>'
            + d.cache.map(c => \`
              <tr>
                <td><span class="cache-tag">\${c.key}</span></td>
                <td class="ok">\${Math.round(c.ttlMs/1000)}s</td>
              </tr>\`).join('')
            + '</tbody></table>'}
      </div>
    </div>

    <!-- Log -->
    <div class="full card">
      <div class="card-header"><h2>Application Log</h2><span class="muted" style="font-size:12px">Last 100 entries · auto-refreshes every 5s</span></div>
      <div class="card-body" style="padding:0 18px 18px">
        <pre class="log" id="log-pre">\${[...d.log].reverse().map(e =>
          '<span class="log-'+e.level+'">['+e.ts.replace('T',' ').slice(0,19)+'] ['+e.level.toUpperCase().padEnd(7)+'] '+escHtml(e.msg)+'</span>'
        ).join('\\n')}</pre>
      </div>
    </div>
  \`;
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

async function triggerSync() {
  const secret = prompt('Enter sync secret:');
  if (!secret) return;
  const btn = document.getElementById('sync-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Running…'; }
  try {
    const r = await fetch('/admin/sync?secret=' + encodeURIComponent(secret), { method: 'POST' });
    if (r.status === 401) { alert('Incorrect secret.'); return; }
    setTimeout(fetchStatus, 2000);
  } finally {
    setTimeout(() => {
      if (btn) { btn.disabled = false; btn.textContent = '▶ Run Now'; }
    }, 3000);
  }
}

// Live uptime counter
setInterval(() => {
  if (!data) {
    const el = document.getElementById('uptime');
    if (el) el.textContent = '';
    return;
  }
  const s = Math.floor((Date.now() - new Date(data.serverStart)) / 1000);
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
  const str = (h?h+'h ':'') + (m?m+'m ':'') + sec+'s';
  const el1 = document.getElementById('uptime');
  const el2 = document.getElementById('uptime-card');
  if (el1) el1.textContent = 'Up ' + str;
  if (el2) el2.textContent = str;
}, 1000);
</script>
</body>
</html>`);
});

// ---------------------------------------------------------------------------
// POST /auth/request-account  { clubName, contactEmail, message? }
// Publicly accessible — lets clubs without an account submit a request.
app.post('/auth/request-account', async (req, res) => {
  const { clubName, contactEmail, message } = req.body as {
    clubName?: string;
    contactEmail?: string;
    message?: string;
  };
  if (!clubName || !contactEmail) {
    return res.status(400).json({ error: 'clubName and contactEmail are required' });
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(contactEmail)) {
    return res.status(400).json({ error: 'invalid email format' });
  }

  const { error } = await supabase
    .from('account_requests')
    .insert({ club_name: clubName, contact_email: contactEmail, message: message ?? null });

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ status: 'ok' });
});

// ---------------------------------------------------------------------------
// Internal endpoint — used by sync_all.ts to clear the cache after a sync.
// Protected by a shared secret, NOT a user JWT.
// ---------------------------------------------------------------------------
app.post('/internal/cache/clear', (req, res) => {
  const secret = req.headers['x-sync-secret'];
  if (!secret || secret !== process.env.SYNC_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  clearAllCache();
  res.json({ status: 'ok', cleared: 'all' });
});

// ---------------------------------------------------------------------------
// Cache administration (root admin only — kept for manual use)
// ---------------------------------------------------------------------------
app.post('/admin/cache/clear-events', requireRoot, (_req, res) => {
  clearCacheKey('events:all');
  res.json({ status: 'ok', cleared: 'events:all' });
});

app.post('/admin/cache/clear-clubs', requireRoot, (_req, res) => {
  clearCacheKey('clubs:all');
  res.json({ status: 'ok', cleared: 'clubs:all' });
});

app.post('/admin/cache/clear-all', requireRoot, (_req, res) => {
  clearAllCache();
  res.json({ status: 'ok', cleared: 'all' });
});

// ---------------------------------------------------------------------------
// GET /events
// ---------------------------------------------------------------------------
app.get('/events', async (_req, res) => {
  try {
    // Set caching headers for Vercel Edge Network
    // s-maxage=120: Edge CDN caches for 2 minutes
    // stale-while-revalidate=59: Serve stale content while fetching fresh data in the background for up to 59s
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=59');

    const cacheKey = 'events:all';
    const cached = getFromCache<any[]>(cacheKey);
    if (cached) return res.json(cached);

    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        clubs ( name, logo_url ),
        event_types ( name ),
        collaborations (
          club_id,
          status,
          clubs ( name, logo_url )
        )
      `)
      .order('start_time', { ascending: true });

    if (error) throw error;

    const enhancedData = data.map((event: any) => ({
      ...event,
      club_name: event.clubs?.name,
      club_logo: event.clubs?.logo_url,
      type: event.event_types?.name ?? 'Other',
      collaborators: (event.collaborations ?? [])
        .filter((c: any) => c.status === 'accepted')
        .map((c: any) => ({ club_id: c.club_id, club_name: c.clubs?.name, club_logo: c.clubs?.logo_url }))
        .filter((c: any) => c.club_name),
    }));

    setInCache(cacheKey, enhancedData ?? []);
    res.json(enhancedData);
  } catch (err: any) {
    console.error('Error fetching events:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// PATCH /events/:id — update event fields (auth required, scoped by role)
// ---------------------------------------------------------------------------
app.patch('/events/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { title, description, location, eventType, rsvpLink, requiresRsvp, rsvpNote, resumeSync } = req.body as {
    title?: string;
    description?: string;
    location?: string;
    eventType?: string;
    rsvpLink?: string | null;
    requiresRsvp?: boolean;
    rsvpNote?: string | null;
    resumeSync?: boolean;
  };

  try {
    // If club_admin, verify the event belongs to their club
    if (req.userRole === 'club_admin') {
      const { data: existing } = await supabase
        .from('events')
        .select('club_id')
        .eq('id', id)
        .single();

      if (!existing || existing.club_id !== req.userClubId) {
        return res.status(403).json({ error: 'You can only edit your own club\'s events' });
      }
    }

    // Resolve eventType name → type_id
    let typeId: string | null = null;
    if (eventType) {
      const { data: et } = await supabase
        .from('event_types')
        .select('id')
        .eq('name', eventType)
        .single();
      typeId = et?.id ?? null;
    }

    const contentChanged = title !== undefined || description !== undefined || location !== undefined || eventType !== undefined;
    const updates: Record<string, any> = {};
    if (resumeSync) {
      updates.manually_edited = false;
    } else if (contentChanged) {
      updates.manually_edited = true;
    }
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (location !== undefined) updates.location = location;
    if (typeId) updates.type_id = typeId;
    if (rsvpLink !== undefined) {
      updates.rsvp_link = rsvpLink || null;
      if (rsvpLink) updates.requires_rsvp = true;
    }
    if (requiresRsvp !== undefined) updates.requires_rsvp = requiresRsvp;
    if (rsvpNote !== undefined) updates.rsvp_note = rsvpNote || null;

    const { data, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', id)
      .select(`*, clubs(name, logo_url), event_types(name)`)
      .single();

    if (error) throw error;

    clearCacheKey('events:all');
    res.json({
      ...data,
      club_name: (data as any).clubs?.name,
      type: (data as any).event_types?.name ?? 'Other',
    });
  } catch (err: any) {
    console.error('Error updating event:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /events — create a new event (auth required, manually_edited = true)
// ---------------------------------------------------------------------------
app.post('/events', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { title, description, location, eventType, clubId, startTime, endTime, rsvpLink, requiresRsvp, rsvpNote } = req.body;

  if (!title || !clubId || !startTime || !endTime) {
    return res.status(400).json({ error: 'title, clubId, startTime, and endTime are required' });
  }

  if (req.userRole === 'club_admin' && clubId !== req.userClubId) {
    return res.status(403).json({ error: 'You can only create events for your own organization' });
  }

  try {
    // Resolve eventType name → type_id
    let typeId: string | null = null;
    if (eventType) {
      const { data: typeRow } = await supabase
        .from('event_types')
        .select('id')
        .eq('name', eventType)
        .single();
      if (typeRow) typeId = typeRow.id;
    }

    const uid = `manual-${crypto.randomUUID()}`;

    const { data, error } = await supabase
      .from('events')
      .insert({
        uid,
        title,
        description: description ?? '',
        location: location ?? '',
        club_id: clubId,
        type_id: typeId,
        start_time: startTime,
        end_time: endTime,
        manually_edited: true,
        requires_rsvp: requiresRsvp ?? (!!rsvpLink || /\b(ticket|rsvp)\b/i.test(description ?? '')),
        rsvp_link: rsvpLink || null,
        rsvp_note: rsvpNote || null,
      })
      .select(`*, clubs(name, logo_url), event_types(name)`)
      .single();

    if (error) throw error;

    clearCacheKey('events:all');
    res.status(201).json({
      ...data,
      club_name: (data as any).clubs?.name,
      club_logo: (data as any).clubs?.logo_url,
      type: (data as any).event_types?.name ?? 'Other',
    });
  } catch (err: any) {
    console.error('Error creating event:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// DELETE /events/:id — delete an event (auth required, scoped by role)
// ---------------------------------------------------------------------------
app.delete('/events/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;

  try {
    if (req.userRole === 'club_admin') {
      const { data: existing } = await supabase
        .from('events')
        .select('club_id')
        .eq('id', id)
        .single();

      if (!existing || existing.club_id !== req.userClubId) {
        return res.status(403).json({ error: 'You can only delete your own club\'s events' });
      }
    }

    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) throw error;

    clearCacheKey('events:all');
    res.json({ status: 'ok' });
  } catch (err: any) {
    console.error('Error deleting event:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /clubs
// ---------------------------------------------------------------------------
app.get('/clubs', async (_req, res) => {
  try {
    // Set caching headers for Vercel Edge Network
    // s-maxage=120: Edge CDN caches for 2 minutes
    // stale-while-revalidate=59: Serve stale content while fetching fresh data in the background for up to 59s
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=59');

    const cacheKey = 'clubs:all';
    const cached = getFromCache<any[]>(cacheKey);
    if (cached) return res.json(cached);

    const [{ data, error }, { data: rolesData }, { data: { users: authUsers } }] = await Promise.all([
      supabase.from('clubs').select('*').order('name', { ascending: true }),
      supabase.from('user_roles').select('club_id, user_id').eq('role', 'club_admin').not('club_id', 'is', null),
      supabase.auth.admin.listUsers({ perPage: 1000 }),
    ]);

    if (error) throw error;

    // Build userId → auth email from the live auth accounts
    const authEmailById: Record<string, string> = {};
    for (const u of authUsers ?? []) {
      if (u.email) authEmailById[u.id] = u.email;
    }

    // Map club → auth email (null if no linked account or account has no email)
    const emailByClub: Record<string, string | null> = {};
    for (const row of rolesData ?? []) {
      if (row.club_id) emailByClub[row.club_id] = authEmailById[row.user_id] ?? null;
    }

    const result = (data ?? []).map((club: any) => ({ ...club, admin_email: emailByClub[club.id] ?? null }));

    setInCache(cacheKey, result);
    res.json(result);
  } catch (err: any) {
    console.error('Error fetching clubs:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /admin/clubs/:id/email  { newEmail }  — root admin only, immediate email change.
app.patch('/admin/clubs/:id/email', requireRoot, async (req: AuthenticatedRequest, res) => {
  const id = req.params.id as string;
  const { newEmail } = req.body as { newEmail?: string };
  if (!newEmail?.trim()) return res.status(400).json({ error: 'newEmail is required' });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(newEmail.trim())) return res.status(400).json({ error: 'Invalid email format' });

  const normalized = newEmail.trim().toLowerCase();

  try {
    const { data: roleRow, error: roleError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('club_id', id)
      .eq('role', 'club_admin')
      .maybeSingle();

    if (roleError) return res.status(500).json({ error: roleError.message });

    // Always fetch the full auth user list — needed for both branches
    const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const allUsers = listData?.users ?? [];

    if (roleRow) {
      // Guard: is the target email already owned by a different auth user?
      const conflict = allUsers.find(u => u.email?.toLowerCase() === normalized && u.id !== roleRow.user_id);
      if (conflict) {
        // Check if the conflicting auth user is actively linked to a different club
        const { data: conflictRole } = await supabase
          .from('user_roles')
          .select('club_id')
          .eq('user_id', conflict.id)
          .maybeSingle();

        if (conflictRole) {
          // Active admin of another club — block the operation
          return res.status(400).json({ error: `${normalized} is already the admin of another active organization.` });
        }

        // Orphaned auth user (no user_roles row) — switchover:
        // Re-point user_roles to the correct-email auth account and delete the stale one.
        const { error: switchErr } = await supabase
          .from('user_roles')
          .update({ user_id: conflict.id, email: normalized })
          .eq('user_id', roleRow.user_id);
        if (switchErr) return res.status(500).json({ error: switchErr.message });

        await supabase.auth.admin.deleteUser(roleRow.user_id);

        clearCacheKey('clubs:all');
        return res.json({ status: 'ok', email: normalized });
      }

      // Account already linked — update email immediately via admin API.
      // email_confirm: true skips Supabase's own confirmation flow.
      const { error: updateErr } = await supabase.auth.admin.updateUserById(
        roleRow.user_id,
        { email: normalized, email_confirm: true },
      );

      if (updateErr) {
        console.error('[PATCH /admin/clubs/:id/email] updateUserById failed:', JSON.stringify(updateErr));
        return res.status(500).json({ error: updateErr.message });
      }

      await supabase.from('user_roles').update({ email: normalized }).eq('user_id', roleRow.user_id);
      await sendPasswordReset(normalized);
    } else {
      // No user_roles row — check if an auth user with this email already exists
      const existing = allUsers.find(u => u.email?.toLowerCase() === normalized);

      if (existing) {
        // Re-link the orphaned auth user to this club (e.g. club was deleted+recreated)
        const { error: upsertErr } = await supabase.from('user_roles').upsert(
          { user_id: existing.id, email: normalized, role: 'club_admin', club_id: id },
          { onConflict: 'user_id' }
        );
        if (upsertErr) return res.status(500).json({ error: upsertErr.message });
      } else {
        return res.status(404).json({ error: 'No account found with that email. Create an account first via Join Requests.' });
      }
    }

    clearCacheKey('clubs:all');
    res.json({ status: 'ok', email: normalized });
  } catch (err: any) {
    console.error('[PATCH /admin/clubs/:id/email]', err);
    res.status(500).json({ error: err.message ?? 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// PATCH /clubs/:id — update club profile (auth required, scoped by role)
// ---------------------------------------------------------------------------
app.patch('/clubs/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { name, description, instagram, linktree, engage, contactEmail, outlookLink, sectionLabels } = req.body as {
    name?: string;
    description?: string;
    instagram?: string;
    linktree?: string;
    engage?: string;
    contactEmail?: string;
    outlookLink?: string;
    sectionLabels?: { exec?: string; board?: string; intern?: string };
  };

  try {
    if (req.userRole === 'club_admin' && req.userClubId !== id) {
      return res.status(403).json({ error: 'You can only update your own club' });
    }

    // Fetch existing jsonb columns to merge rather than overwrite
    const { data: current } = await supabase
      .from('clubs')
      .select('metadata_tags, social_links')
      .eq('id', id)
      .single();

    const currentMeta = (current?.metadata_tags as Record<string, any>) ?? {};
    const currentSocial = (current?.social_links as Record<string, any>) ?? {};

    const updates: Record<string, any> = {};
    if (name !== undefined) {
      if (req.userRole !== 'root') return res.status(403).json({ error: 'Only root admin can rename an organization' });
      if (!name.trim()) return res.status(400).json({ error: 'name cannot be empty' });
      updates.name = name.trim();
    }
    if (description !== undefined || sectionLabels !== undefined) {
      updates.metadata_tags = {
        ...currentMeta,
        ...(description !== undefined ? { description } : {}),
        ...(sectionLabels !== undefined ? { section_labels: sectionLabels } : {}),
      };
    }
    if (instagram !== undefined || linktree !== undefined || engage !== undefined || contactEmail !== undefined) {
      updates.social_links = {
        ...currentSocial,
        ...(instagram !== undefined ? { instagram } : {}),
        ...(linktree !== undefined ? { linktree } : {}),
        ...(engage !== undefined ? { engage } : {}),
        ...(contactEmail !== undefined ? { contact_email: contactEmail || null } : {}),
      };
    }
    if (outlookLink !== undefined) {
      updates.ics_source_url = outlookLink || null;
    }

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase.from('clubs').update(updates).eq('id', id);
      if (error) throw error;
    }

    clearCacheKey('clubs:all');
    const { data, error: fetchError } = await supabase.from('clubs').select().eq('id', id).single();
    if (fetchError) throw fetchError;
    res.json(data);
  } catch (err: any) {
    console.error('Error updating club:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Color helpers for logo-based club color assignment
// ---------------------------------------------------------------------------
function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function rgbDistance(h1: string, h2: string): number {
  const [r1, g1, b1] = hexToRgb(h1);
  const [r2, g2, b2] = hexToRgb(h2);
  return Math.sqrt((r2 - r1) ** 2 + (g2 - g1) ** 2 + (b2 - b1) ** 2);
}

/** Rotate the hue of a hex color by `degrees` (0-360). */
function rotateHue(hex: string, degrees: number): string {
  let [r, g, b] = hexToRgb(hex).map(v => v / 255) as [number, number, number];
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  h = ((h * 360 + degrees) % 360) / 360;
  const sFinal = Math.max(0.45, s);
  const lFinal = Math.min(0.65, Math.max(0.35, l));
  const q = lFinal < 0.5 ? lFinal * (1 + sFinal) : lFinal + sFinal - lFinal * sFinal;
  const p = 2 * lFinal - q;
  const hue2rgb = (t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return '#' + [hue2rgb(h + 1 / 3), hue2rgb(h), hue2rgb(h - 1 / 3)]
    .map(v => Math.round(v * 255).toString(16).padStart(2, '0'))
    .join('');
}

/** Ensure `color` is at least MIN_DISTANCE away from all other clubs' colors. */
async function deduplicateColor(color: string, excludeClubId: string): Promise<string> {
  const MIN_DISTANCE = 85;
  const { data } = await supabase.from('clubs').select('metadata_tags').neq('id', excludeClubId);
  const existingColors: string[] = (data ?? [])
    .map((c: any) => c.metadata_tags?.color)
    .filter((c: any) => typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c));

  let result = color;
  for (let attempt = 0; attempt < 12; attempt++) {
    if (!existingColors.some(ec => rgbDistance(result, ec) < MIN_DISTANCE)) break;
    result = rotateHue(result, 30);
  }
  return result;
}

// ---------------------------------------------------------------------------
// POST /clubs/:id/logo  { logo: "data:<mime>;base64,<data>", color?: "#rrggbb" }
// Upload a club logo image to Supabase Storage and update logo_url.
// If `color` is provided, stores it in metadata_tags.color after de-duplication.
// Root can update any club; club_admin can only update their own.
// ---------------------------------------------------------------------------
app.post('/clubs/:id/logo', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { logo, color } = req.body as { logo?: string; color?: string };
  if (!logo) return res.status(400).json({ error: 'logo is required' });

  try {
    if (req.userRole === 'club_admin' && req.userClubId !== id) {
      return res.status(403).json({ error: 'You can only update your own club logo' });
    }

    // Parse the data URL: "data:<mime>;base64,<data>"
    const match = logo.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (!match) return res.status(400).json({ error: 'Invalid image data URL' });
    const [, contentType, base64Data] = match;
    const ext = contentType.split('/')[1].replace('+xml', '');
    const buffer = Buffer.from(base64Data, 'base64');
    const filename = `${id}.${ext}`;

    // Ensure the bucket exists (no-op if already exists)
    await supabase.storage.createBucket('club-logos', { public: true }).catch(() => { });

    // Upload (upsert so re-uploading replaces the previous logo)
    const { error: uploadError } = await supabase.storage
      .from('club-logos')
      .upload(filename, buffer, { contentType, upsert: true });

    if (uploadError) return res.status(500).json({ error: uploadError.message });

    const { data: { publicUrl } } = supabase.storage.from('club-logos').getPublicUrl(filename);

    // Build the DB update payload
    const updatePayload: Record<string, any> = { logo_url: publicUrl };

    // If the frontend supplied an extracted dominant color, de-duplicate it
    // against all other clubs and store in metadata_tags.color
    if (color && /^#[0-9a-f]{6}$/i.test(color)) {
      const uniqueColor = await deduplicateColor(color, id as string);
      // Merge into existing metadata_tags (JSONB)
      const { data: existing } = await supabase
        .from('clubs').select('metadata_tags').eq('id', id).single();
      const existingTags = (existing as any)?.metadata_tags ?? {};
      updatePayload.metadata_tags = { ...existingTags, color: uniqueColor };
    }

    const { data, error: updateError } = await supabase
      .from('clubs')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (updateError) return res.status(500).json({ error: updateError.message });

    clearCacheKey('clubs:all');
    res.json({ logo_url: publicUrl, club: data });
  } catch (err: any) {
    console.error('Error uploading logo:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// POST /clubs — create a new club (root only)
// ---------------------------------------------------------------------------
app.post('/clubs', requireRoot, async (_req: AuthenticatedRequest, res) => {
  const { name, orgType, description } = _req.body as {
    name?: string;
    orgType?: 'union' | 'department';
    description?: string;
  };
  if (!name?.trim()) return res.status(400).json({ error: 'name is required' });

  const metadata_tags: Record<string, any> = {};
  if (description?.trim()) metadata_tags.description = description.trim();

  const { data, error } = await supabase
    .from('clubs')
    .insert({
      name: name.trim(),
      org_type: orgType ?? 'union',
      metadata_tags: Object.keys(metadata_tags).length ? metadata_tags : null,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  clearCacheKey('clubs:all');
  res.status(201).json(data);
});

// ---------------------------------------------------------------------------
// DELETE /clubs/:id — delete a club and all its events/roles (root only)
// ---------------------------------------------------------------------------
app.delete('/clubs/:id', requireRoot, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  try {
    // 1. Delete all events belonging to this club
    const { error: eventsError } = await supabase.from('events').delete().eq('club_id', id);
    if (eventsError) throw eventsError;

    // 2. Remove user_roles rows tied to this club (orphaned club admin accounts)
    const { error: rolesError } = await supabase.from('user_roles').delete().eq('club_id', id);
    if (rolesError) throw rolesError;

    // 3. Delete the club itself
    const { error: clubError } = await supabase.from('clubs').delete().eq('id', id);
    if (clubError) throw clubError;

    clearCacheKey('clubs:all');
    clearCacheKey('events:all');
    res.json({ status: 'ok' });
  } catch (err: any) {
    console.error('Error deleting club:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /admin/requests — list all account requests (root only)
// ---------------------------------------------------------------------------
app.get('/admin/requests', requireRoot, async (_req, res) => {
  const { data, error } = await supabase
    .from('account_requests')
    .select('id, club_name, contact_email, message, status, created_at')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

// ---------------------------------------------------------------------------
// POST /admin/requests/:id/approve  { orgType? }
// Creates club + auth user + user_role; marks request approved.
// Returns: { clubId, clubName, email, password }
// ---------------------------------------------------------------------------
app.post('/admin/requests/:id/approve', requireRoot, async (req: AuthenticatedRequest, res) => {
  const requestId = req.params.id as string;
  const { orgType = 'union' } = req.body as { orgType?: string };

  const { data: request, error: fetchErr } = await supabase
    .from('account_requests')
    .select('id, club_name, contact_email, status')
    .eq('id', requestId)
    .single();

  if (fetchErr || !request) return res.status(404).json({ error: 'Request not found' });
  if ((request as any).status !== 'pending') {
    return res.status(400).json({ error: `Request is already ${(request as any).status}` });
  }

  const clubName = (request as any).club_name as string;
  const email = (request as any).contact_email as string;

  // Guard: reject if a club with this name is already registered
  const { data: existingClub } = await supabase
    .from('clubs')
    .select('id')
    .ilike('name', clubName)
    .maybeSingle();

  if (existingClub) {
    return res.status(400).json({
      error: `"${clubName}" is already a registered organization on the platform.`,
    });
  }

  // Internal-only placeholder password — never sent to the user.
  // The user will set their own password via the recovery link below.
  const internalPassword =
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 6).toUpperCase() +
    '!2';

  try {
    // 1. Create club
    const { data: club, error: clubErr } = await supabase
      .from('clubs')
      .insert({ name: clubName, org_type: orgType })
      .select('id, name')
      .single();

    if (clubErr || !club) throw clubErr ?? new Error('Failed to create club');

    // 2. Resolve auth user — create fresh, or reuse an orphaned one (no user_role) if already registered
    let userId: string;
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email,
      password: internalPassword,
      email_confirm: true,
    });

    if (authErr) {
      const alreadyExists = authErr.message?.toLowerCase().includes('already been registered') ||
        authErr.message?.toLowerCase().includes('already registered');
      if (!alreadyExists) {
        await supabase.from('clubs').delete().eq('id', (club as any).id);
        throw authErr;
      }
      // Orphaned auth user (exists in Supabase but has no user_role). Reset their password.
      const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      const orphan = listData?.users?.find((u: any) => u.email === email);
      if (!orphan) {
        await supabase.from('clubs').delete().eq('id', (club as any).id);
        throw new Error('Auth user exists but could not be retrieved — please manually remove it in Supabase Auth before approving.');
      }
      userId = orphan.id;
      await supabase.auth.admin.updateUserById(userId, { password: internalPassword });
    } else if (!authData?.user) {
      await supabase.from('clubs').delete().eq('id', (club as any).id);
      throw new Error('Failed to create auth user');
    } else {
      userId = authData.user.id;
    }

    // 3. Insert user_role
    const { error: roleErr } = await supabase.from('user_roles').insert({
      user_id: userId,
      email,
      club_id: (club as any).id,
      role: 'club_admin',
    });

    if (roleErr) {
      await supabase.auth.admin.deleteUser(userId);
      await supabase.from('clubs').delete().eq('id', (club as any).id);
      throw roleErr;
    }

    // 4. Mark request approved
    await supabase.from('account_requests').update({ status: 'approved' }).eq('id', requestId);

    clearCacheKey('clubs:all');

    // 5. Send password-set email (best-effort, fire-and-forget)
    sendPasswordReset(email).catch(err =>
      log.error(`sendPasswordReset failed for ${email}: ${err.message}`)
    );

    res.json({ clubId: (club as any).id, clubName: (club as any).name, email });
  } catch (err: any) {
    res.status(500).json({ error: err.message ?? 'Approval failed' });
  }
});

// ---------------------------------------------------------------------------
// POST /admin/requests/:id/reject
// ---------------------------------------------------------------------------
app.post('/admin/requests/:id/reject', requireRoot, async (req: AuthenticatedRequest, res) => {
  const { error } = await supabase
    .from('account_requests')
    .update({ status: 'rejected' })
    .eq('id', req.params.id as string);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ status: 'ok' });
});

// ---------------------------------------------------------------------------
// DELETE /admin/requests — clear history (approved + rejected) requests (root only)
// Preserves pending requests. Allows previously rejected applicants to reapply.
// ---------------------------------------------------------------------------
app.delete('/admin/requests', requireRoot, async (_req, res) => {
  const { error } = await supabase
    .from('account_requests')
    .delete()
    .in('status', ['approved', 'rejected']);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ status: 'ok' });
});

// ---------------------------------------------------------------------------
// GET /admin/users — list all club admin accounts (root only)
// Returns: { id, email, clubId, clubName }[]
// ---------------------------------------------------------------------------
app.get('/admin/users', requireRoot, async (_req, res) => {
  const { data, error } = await supabase
    .from('user_roles')
    .select('user_id, email, club_id, raw_password, clubs ( name )')
    .eq('role', 'club_admin')
    .order('email', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });

  const users = (data ?? []).map((row: any) => ({
    id: row.user_id,
    email: row.email,
    clubId: row.club_id,
    clubName: row.clubs?.name ?? null,
    rawPassword: row.raw_password ?? null,
  }));

  res.json(users);
});

// POST /admin/passwords/:userId  { newPassword }
// Root admin forcibly sets a club admin's password.
// ---------------------------------------------------------------------------
app.post('/admin/passwords/:userId', requireRoot, async (req: AuthenticatedRequest, res) => {
  const userId = req.params.userId as string;
  const { newPassword } = req.body as { newPassword?: string };
  if (!newPassword) return res.status(400).json({ error: 'newPassword is required' });
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const { error } = await supabase.auth.admin.updateUserById(userId, { password: newPassword });
  if (error) return res.status(500).json({ error: error.message });

  // Persist the raw password so root admin can look it up later
  await supabase.from('user_roles').update({ raw_password: newPassword }).eq('user_id', userId);

  res.json({ status: 'ok' });
});

// ---------------------------------------------------------------------------
// Event Types CRUD (root admin only)
// ---------------------------------------------------------------------------
app.get('/event-types', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('event_types')
      .select('id, name')
      .order('name', { ascending: true });
    if (error) throw error;
    res.json(data ?? []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/event-types', requireRoot, async (req: AuthenticatedRequest, res) => {
  const { name } = req.body as { name?: string };
  if (!name?.trim()) return res.status(400).json({ error: 'name is required' });

  const { data, error } = await supabase
    .from('event_types')
    .insert({ name: name.trim() })
    .select('id, name')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

app.patch('/event-types/:id', requireRoot, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { name } = req.body as { name?: string };
  if (!name?.trim()) return res.status(400).json({ error: 'name is required' });

  const { data, error } = await supabase
    .from('event_types')
    .update({ name: name.trim() })
    .eq('id', id)
    .select('id, name')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.delete('/event-types/:id', requireRoot, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('event_types').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ status: 'ok' });
});

// ---------------------------------------------------------------------------
// GET /events/ics — generate a custom ICS calendar file
// Query: ?filters=CLUB_ID_1:TYPE_ID_1,CLUB_ID_2:TYPE_ID_2
// Omit TYPE_ID to include all types for that club: CLUB_ID:
// ---------------------------------------------------------------------------
const { createEvents } = require('ics');

app.get('/events/ics', async (req, res) => {
  try {
    const filtersParam = req.query.filters as string;
    if (!filtersParam) {
      return res.status(400).send("Missing 'filters' query parameter.");
    }

    const rules = filtersParam.split(',').map(rule => {
      const [clubId, typeId] = rule.split(':');
      return { clubId, typeId: typeId || null };
    });

    const { data: events, error } = await supabase
      .from('events')
      .select(`*, clubs ( name ), event_types ( name )`)
      .gt('end_time', new Date().toISOString())
      .order('start_time', { ascending: true });

    if (error) throw error;

    const filteredEvents = events.filter((event: any) =>
      rules.some(rule => {
        const clubMatch = event.club_id === rule.clubId;
        const typeMatch = rule.typeId ? event.type_id === rule.typeId : true;
        return clubMatch && typeMatch;
      })
    );

    if (filteredEvents.length === 0) {
      return res.status(404).send('No events found matching criteria.');
    }

    const icsEvents = filteredEvents.map((e: any) => {
      const start = new Date(e.start_time);
      const end = new Date(e.end_time);
      return {
        start: [start.getUTCFullYear(), start.getUTCMonth() + 1, start.getUTCDate(), start.getUTCHours(), start.getUTCMinutes()],
        end: [end.getUTCFullYear(), end.getUTCMonth() + 1, end.getUTCDate(), end.getUTCHours(), end.getUTCMinutes()],
        title: e.title,
        description: e.description,
        location: e.location,
        url: e.rsvp_link ?? undefined,
        uid: e.uid,
        organizer: { name: e.clubs?.name, email: 'mcc-scheduler@uoregon.edu' },
        productId: 'mcc-scheduler/ics',
      };
    });

    createEvents(icsEvents, (err: any, value: string) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Error generating ICS');
      }
      res.setHeader('Content-Type', 'text/calendar');
      res.setHeader('Content-Disposition', 'attachment; filename=custom-schedule.ics');
      res.send(value);
    });
  } catch (err: any) {
    console.error('Error serving ICS:', err);
    res.status(500).send(err.message);
  }
});

// ---------------------------------------------------------------------------
// Site Settings — flexible JSON storage for page content (e.g. About page)
// ---------------------------------------------------------------------------

// GET /site-settings/:key — public, returns the stored JSON value (or null)
app.get('/site-settings/:key', async (req, res) => {
  const { key } = req.params;
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle();
    if (error) throw error;
    res.json(data ? data.value : null);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /site-settings/:key — root only, upserts the JSON value
app.put('/site-settings/:key', requireRoot, async (req: AuthenticatedRequest, res) => {
  const { key } = req.params;
  const { value } = req.body as { value?: unknown };
  if (value === undefined) return res.status(400).json({ error: 'value is required' });

  try {
    const { error } = await supabase
      .from('site_settings')
      .upsert({ key, value, updated_at: new Date().toISOString() });
    if (error) throw error;
    res.json({ status: 'ok' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /site-settings/upload — root only, uploads a media file to Supabase Storage
// Body: { dataUrl: string, filename: string }
// Returns: { url: string }
app.post('/site-settings/upload', requireRoot, async (req: AuthenticatedRequest, res) => {
  const { dataUrl, filename } = req.body as { dataUrl?: string; filename?: string };
  if (!dataUrl || !filename) {
    return res.status(400).json({ error: 'dataUrl and filename are required' });
  }

  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return res.status(400).json({ error: 'Invalid data URL format' });

  const [, contentType, base64] = match;
  const buffer = Buffer.from(base64, 'base64');
  const ext = contentType.split('/')[1]?.split('+')[0] ?? 'bin';
  const safeName = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}.${ext}`;

  try {
    await supabase.storage.createBucket('mcc-public-assets', { public: true }).catch(() => { });

    const { error: uploadError } = await supabase.storage
      .from('mcc-public-assets')
      .upload(safeName, buffer, { contentType, upsert: false });
    if (uploadError) return res.status(500).json({ error: uploadError.message });

    const { data: { publicUrl } } = supabase.storage
      .from('mcc-public-assets')
      .getPublicUrl(safeName);

    res.json({ url: publicUrl });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// Club Members — GET / POST / PATCH / DELETE / photo upload
// Table: club_members (id, club_id, section, name, title, email, photo_url, sort_order)
// ---------------------------------------------------------------------------

// GET /clubs/:id/members — public
app.get('/clubs/:id/members', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('club_members')
    .select('id, section, name, title, email, photo_url, sort_order')
    .eq('club_id', id)
    .order('section')
    .order('sort_order')
    .order('created_at');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

// POST /clubs/:id/members  { section, name, title, email?, sort_order? }
app.post('/clubs/:id/members', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  if (req.userRole === 'club_admin' && req.userClubId !== id) {
    return res.status(403).json({ error: 'You can only manage your own club members' });
  }
  const { section, name, title, email, sort_order } = req.body as {
    section?: string; name?: string; title?: string; email?: string; sort_order?: number;
  };
  if (!section || !name || !title) {
    return res.status(400).json({ error: 'section, name, and title are required' });
  }
  if (!['exec', 'board', 'intern'].includes(section)) {
    return res.status(400).json({ error: 'section must be exec, board, or intern' });
  }
  const { data, error } = await supabase
    .from('club_members')
    .insert({ club_id: id, section, name, title, email: email ?? null, sort_order: sort_order ?? 0 })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PATCH /clubs/:id/members/:memberId  { section?, name?, title?, email?, sort_order? }
app.patch('/clubs/:id/members/:memberId', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { id, memberId } = req.params;
  if (req.userRole === 'club_admin' && req.userClubId !== id) {
    return res.status(403).json({ error: 'You can only manage your own club members' });
  }
  const { section, name, title, email, sort_order } = req.body as {
    section?: string; name?: string; title?: string; email?: string | null; sort_order?: number;
  };
  if (section && !['exec', 'board', 'intern'].includes(section)) {
    return res.status(400).json({ error: 'section must be exec, board, or intern' });
  }
  const updates: Record<string, any> = {};
  if (section !== undefined) updates.section = section;
  if (name !== undefined) updates.name = name;
  if (title !== undefined) updates.title = title;
  if (email !== undefined) updates.email = email || null;
  if (sort_order !== undefined) updates.sort_order = sort_order;

  const { data, error } = await supabase
    .from('club_members')
    .update(updates)
    .eq('id', memberId)
    .eq('club_id', id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Member not found' });

  // If email was updated, send a password reset (best-effort)
  if (email && email.trim() !== '') {
    sendPasswordReset(email.trim().toLowerCase()).catch(err =>
      console.error('Failed to send password reset email:', err)
    );
  }

  res.json(data);
});

// DELETE /clubs/:id/members/:memberId
app.delete('/clubs/:id/members/:memberId', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { id, memberId } = req.params;
  if (req.userRole === 'club_admin' && req.userClubId !== id) {
    return res.status(403).json({ error: 'You can only manage your own club members' });
  }
  const { error } = await supabase
    .from('club_members')
    .delete()
    .eq('id', memberId)
    .eq('club_id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ status: 'ok' });
});

// POST /clubs/:id/members/:memberId/photo  { photo: "data:<mime>;base64,<data>" }
app.post('/clubs/:id/members/:memberId/photo', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { id, memberId } = req.params;
  const { photo } = req.body as { photo?: string };
  if (!photo) return res.status(400).json({ error: 'photo is required' });

  const match = photo.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  if (!match) return res.status(400).json({ error: 'Invalid image data URL' });
  const [, contentType, base64Data] = match;
  const ext = contentType.split('/')[1].replace('+xml', '');
  const buffer = Buffer.from(base64Data, 'base64');
  const filename = `${memberId}.${ext}`;

  await supabase.storage.createBucket('member-photos', { public: true }).catch(() => { });
  const { error: uploadError } = await supabase.storage
    .from('member-photos')
    .upload(filename, buffer, { contentType, upsert: true });
  if (uploadError) return res.status(500).json({ error: uploadError.message });

  const { data: { publicUrl } } = supabase.storage.from('member-photos').getPublicUrl(filename);

  const { data, error: updateError } = await supabase
    .from('club_members')
    .update({ photo_url: publicUrl })
    .eq('id', memberId)
    .eq('club_id', id)
    .select()
    .single();
  if (updateError) return res.status(500).json({ error: updateError.message });
  res.json({ photo_url: publicUrl, member: data });
});

// ---------------------------------------------------------------------------
// POST /events/:id/collaborators — manually add a club as a collaborator
// ---------------------------------------------------------------------------
app.post('/events/:id/collaborators', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { clubId } = req.body as { clubId: string };
  if (!clubId) return res.status(400).json({ error: 'clubId is required' });

  try {
    const { data: evt } = await supabase.from('events').select('club_id').eq('id', id).single();
    if (!evt) return res.status(404).json({ error: 'Event not found' });

    if (req.userRole === 'club_admin' && evt.club_id !== req.userClubId) {
      return res.status(403).json({ error: 'Can only add collaborators to your own events' });
    }
    if (evt.club_id === clubId) {
      return res.status(400).json({ error: 'Cannot add the host club as a collaborator' });
    }

    const { data, error } = await supabase
      .from('collaborations')
      .upsert({ event_id: id, club_id: clubId, role: 'secondary', status: 'accepted', manually_removed: false },
        { onConflict: 'event_id,club_id' })
      .select('id, club_id')
      .single();

    if (error) throw error;
    clearCacheKey('events:all');
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// DELETE /events/:id/collaborators/:clubId — remove a collaborator
// ---------------------------------------------------------------------------
app.delete('/events/:id/collaborators/:clubId', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { id, clubId } = req.params;

  try {
    const { data: evt } = await supabase.from('events').select('club_id').eq('id', id).single();
    if (!evt) return res.status(404).json({ error: 'Event not found' });

    if (req.userRole === 'club_admin' && evt.club_id !== req.userClubId) {
      return res.status(403).json({ error: 'Can only remove collaborators from your own events' });
    }

    const { error } = await supabase
      .from('collaborations')
      .update({ manually_removed: true, status: 'rejected' })
      .eq('event_id', id)
      .eq('club_id', clubId);

    if (error) throw error;
    clearCacheKey('events:all');
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /collab — list collaborations for the current user's club (all statuses)
// ---------------------------------------------------------------------------
app.get('/collab', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    let query = supabase
      .from('collaborations')
      .select(`
        id, event_id, club_id, role, status,
        events ( id, title, start_time, end_time,
          clubs ( name, logo_url )
        )
      `)
      .eq('manually_removed', false);

    if (req.userRole === 'club_admin') {
      query = query.eq('club_id', req.userClubId);
    }

    const { data, error } = await query.order('status', { ascending: false });
    if (error) throw error;
    res.json(data ?? []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// PATCH /collab/:id — accept or reject a collaboration
// ---------------------------------------------------------------------------
app.patch('/collab/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { status } = req.body as { status: string };

  if (!['accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'status must be "accepted" or "rejected"' });
  }

  try {
    if (req.userRole === 'club_admin') {
      const { data: collab } = await supabase
        .from('collaborations')
        .select('club_id')
        .eq('id', id)
        .single();

      if (!collab || collab.club_id !== req.userClubId) {
        return res.status(403).json({ error: 'Not authorized to update this collaboration' });
      }
    }

    const { error } = await supabase
      .from('collaborations')
      .update({ status, manually_removed: false })
      .eq('id', id);

    if (error) throw error;

    clearCacheKey('events:all');
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// DELETE /collab/:id — permanently remove a rejected collaboration record
// ---------------------------------------------------------------------------
app.delete('/collab/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;

  try {
    if (req.userRole === 'club_admin') {
      const { data: collab } = await supabase
        .from('collaborations')
        .select('club_id, status')
        .eq('id', id)
        .single();

      if (!collab || collab.club_id !== req.userClubId) {
        return res.status(403).json({ error: 'Not authorized to delete this collaboration' });
      }
      if (collab.status !== 'rejected') {
        return res.status(400).json({ error: 'Only rejected collaborations can be deleted' });
      }
    }

    const { error } = await supabase
      .from('collaborations')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// 404 — no route matched
// ---------------------------------------------------------------------------
app.use((req: express.Request, res: express.Response) => {
  log.warn(`404 ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// ---------------------------------------------------------------------------
// Global error handler — catches anything thrown/next(err)'d in route handlers
// ---------------------------------------------------------------------------
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  log.error(`Unhandled error on ${req.method} ${req.originalUrl}: ${err?.message ?? err}`);
  if (err?.stack) log.error(err.stack);
  const status = typeof err?.status === 'number' ? err.status : 500;
  res.status(status).json({ error: err?.message ?? 'Internal server error' });
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
if (require.main === module) {
  app.listen(PORT, () => {
    log.success(`MCC API running on http://localhost:${PORT}`);
    startCron();
  });
}

export default app;
