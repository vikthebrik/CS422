# Security Policy

## Reporting a Vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Report vulnerabilities privately via one of these channels:
- **GitHub Security Advisories:** use the "Report a vulnerability" button on the Security tab of this repo
- **Email:** contact the maintainer directly (see commit history for contact info)

Include a description of the issue, steps to reproduce, and potential impact. You will receive a response within 5 business days.

## What Counts as a Security Issue

- Exposed or hardcoded secrets/credentials in source code or build artifacts
- Authentication bypass or privilege escalation in the backend API
- SQL injection, XSS, CSRF, or other OWASP Top 10 issues
- Insecure direct object references (e.g., a club admin modifying another club's data)
- Sensitive data leakage via API responses

## Secret Management for Maintainers

### Rules
- **Never commit `.env` files.** The `.gitignore` blocks `.env*` at every level — keep it that way.
- New contributors should copy `.env.example` → `.env` and fill in their own values.
- Service role keys, sync secrets, and API keys live only in:
  - `server/.env` locally (never committed)
  - Render environment variables in production

### Rotating Secrets
If a secret is ever exposed:

1. **Supabase service role key**
   - Dashboard → Project Settings → API → regenerate service role key
   - Update `SUPABASE_KEY` in Render environment variables
   - Update local `server/.env`

2. **SYNC_SECRET**
   ```bash
   openssl rand -hex 32
   ```
   - Update `SYNC_SECRET` in Render environment variables
   - Update local `server/.env`

3. **RESEND_API_KEY**
   - Regenerate in the Resend dashboard
   - Update in Render and local `.env`

4. After rotating, redeploy the Render service and verify the app functions correctly.

## Dependency Vulnerabilities

`npm audit --audit-level=high` runs on every CI build for the server. If it flags a high or critical CVE, open a pull request to update the affected dependency before merging other changes.

## Supported Versions

This is a university coursework project. Only the `main` branch is actively maintained.
