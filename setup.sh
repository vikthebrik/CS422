#!/usr/bin/env bash
set -e

# MCC Scheduler — local dev bootstrap
# Usage: bash setup.sh  (or ./setup.sh after chmod +x setup.sh)

# ── Prerequisites ──────────────────────────────────────────────────────────────

check_cmd() {
  if ! command -v "$1" &>/dev/null; then
    echo "ERROR: '$1' not found on PATH. $2"
    exit 1
  fi
}

check_cmd node  "Install Node.js >=18 from https://nodejs.org"
check_cmd pnpm  "Install pnpm: npm install -g pnpm"

NODE_MAJOR=$(node -e "process.stdout.write(process.versions.node.split('.')[0])")
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "ERROR: Node.js >=18 required (found $(node -v)). Update at https://nodejs.org"
  exit 1
fi

# ── .env files ─────────────────────────────────────────────────────────────────

if [ ! -f server/.env ]; then
  cp server/.env.example server/.env
  echo "Created server/.env from server/.env.example"
else
  echo "server/.env already exists — skipping (will not overwrite)"
fi

if [ ! -f frontend/.env ]; then
  cp frontend/.env.example frontend/.env
  echo "Created frontend/.env from frontend/.env.example"
else
  echo "frontend/.env already exists — skipping (will not overwrite)"
fi

# ── Install dependencies ───────────────────────────────────────────────────────

echo ""
echo "Installing server dependencies (npm)..."
(cd server && npm install)

echo ""
echo "Installing frontend dependencies (pnpm)..."
(cd frontend && pnpm install)

# ── Next steps ─────────────────────────────────────────────────────────────────

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " Setup complete! Next steps:"
echo ""
echo "  1. Fill in server/.env:"
echo "       SUPABASE_URL, SUPABASE_KEY (service role)"
echo "       SYNC_SECRET, ALLOWED_ORIGINS, FRONTEND_URL"
echo "       RESEND_API_KEY, SMTP_FROM"
echo ""
echo "  2. Fill in frontend/.env:"
echo "       VITE_API_BASE_URL (default: http://localhost:4000)"
echo ""
echo "  3. Apply DB migrations in Supabase SQL editor"
echo "     (see plans/ for migration files)"
echo ""
echo "  4. Start the dev servers in separate terminals:"
echo "       cd server  && npm run dev    # http://localhost:4000"
echo "       cd frontend && pnpm dev      # http://localhost:5173"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
