/**
 * @file logger.ts
 * Structured, color-coded console logger for the MCC API.
 *
 * Output format:
 *   [2026-03-05 14:23:01] ✓ Server running on port 4000
 *   [2026-03-05 14:23:04] GET     /events                          200  12ms
 *   [2026-03-05 14:23:05] POST    /auth/login                      401  8ms   [no role]
 *   [2026-03-05 14:23:06] PATCH   /events/abc-123                  200  34ms  [club_admin]
 *   [2026-03-05 14:23:07] ⚠ Cache miss: events:all
 *   [2026-03-05 14:23:09] ✗ Unhandled error on DELETE /clubs/xyz: ...
 *
 * No external dependencies — plain Node.js ANSI escape codes.
 */

import { Request, Response, NextFunction } from 'express';

// ---------------------------------------------------------------------------
// ANSI color codes
// ---------------------------------------------------------------------------
const C = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  dim:     '\x1b[2m',
  red:     '\x1b[31m',
  green:   '\x1b[32m',
  yellow:  '\x1b[33m',
  blue:    '\x1b[34m',
  cyan:    '\x1b[36m',
  gray:    '\x1b[90m',
  white:   '\x1b[97m',
} as const;

function ts(): string {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function prefix(): string {
  return `${C.gray}[${ts()}]${C.reset}`;
}

function statusColor(code: number): string {
  if (code >= 500) return C.red;
  if (code >= 400) return C.yellow;
  if (code >= 300) return C.cyan;
  return C.green;
}

function pad(s: string, n: number): string {
  return s.length >= n ? s : s + ' '.repeat(n - s.length);
}

// ---------------------------------------------------------------------------
// Public log helpers
// ---------------------------------------------------------------------------
export const log = {
  /** General informational message (blue ℹ). */
  info(msg: string, ...rest: unknown[]): void {
    console.log(`${prefix()} ${C.cyan}ℹ${C.reset}  ${msg}`, ...rest);
  },

  /** Success / positive event (green ✓). */
  success(msg: string, ...rest: unknown[]): void {
    console.log(`${prefix()} ${C.green}✓${C.reset}  ${msg}`, ...rest);
  },

  /** Non-fatal warning (yellow ⚠). */
  warn(msg: string, ...rest: unknown[]): void {
    console.warn(`${prefix()} ${C.yellow}⚠${C.reset}  ${msg}`, ...rest);
  },

  /** Error or failure (red ✗). */
  error(msg: string, ...rest: unknown[]): void {
    console.error(`${prefix()} ${C.red}✗${C.reset}  ${msg}`, ...rest);
  },

  /** Cache hit/miss — dim, for high-volume endpoints. */
  cache(hit: boolean, key: string): void {
    const icon = hit ? `${C.green}●${C.reset}` : `${C.gray}○${C.reset}`;
    console.log(`${prefix()} ${icon}  cache ${hit ? 'hit' : 'miss'}: ${C.dim}${key}${C.reset}`);
  },

  /** Cron / sync events. */
  cron(msg: string, ...rest: unknown[]): void {
    console.log(`${prefix()} ${C.blue}↻${C.reset}  ${C.bold}[cron]${C.reset} ${msg}`, ...rest);
  },

  /** Auth events (login, logout, token validation). */
  auth(msg: string, ...rest: unknown[]): void {
    console.log(`${prefix()} ${C.cyan}🔑${C.reset} ${C.bold}[auth]${C.reset} ${msg}`, ...rest);
  },
};

// ---------------------------------------------------------------------------
// HTTP request logger middleware
// Logs one line per request after the response is sent, e.g.:
//   GET     /events                          200  12ms
//   POST    /auth/login                      401  8ms   [club_admin · club-xyz]
// ---------------------------------------------------------------------------
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const ms    = Date.now() - start;
    const code  = res.statusCode;
    const sc    = statusColor(code);
    const ar    = req as any;

    // Build context tag from auth middleware fields (populated after requireAuth runs)
    let tag = '';
    if (ar.userRole) {
      tag = `${C.gray}[${ar.userRole}${ar.userClubId ? ` · ${ar.userClubId.slice(0, 8)}` : ''}]${C.reset}`;
    }

    const method = `${C.bold}${pad(req.method, 7)}${C.reset}`;
    const path   = pad(req.originalUrl, 40);
    const status = `${sc}${code}${C.reset}`;
    const time   = `${C.dim}${ms}ms${C.reset}`;

    console.log(`${prefix()} ${method}${path} ${status}  ${time}  ${tag}`);
  });

  next();
}
