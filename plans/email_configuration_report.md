# Configuration Report: App Email Notifications (uomcc.org)

This report details the integration of Resend as the SMTP provider for Supabase Auth on the uomcc.org domain.

## 1. SMTP Provider Configuration (Resend)
- **Domain Added:** `uomcc.org` has been added to the Resend Domains dashboard.
- **API Key:** An API key (named "MCC Scheduler Supabase SMTP Key") was generated in Resend.
- **SMTP Credentials:**
  - **Host:** `smtp.resend.com`
  - **Port:** `465` (SSL/TLS)
  - **Username:** `resend`
  - **Auth Method:** API Key (used as Password)

## 2. Supabase Auth Settings
- **Dashboard URL:** Supabase SMTP Settings
- **Sender Details:**
  - **Sender Email:** `noreply.auth@uomcc.org`
  - **Sender Name:** UO MCC Scheduler Tool Notifications
- **Configuration Status:** Custom SMTP is toggled ON.
- **Note:** As of the last check, the port was set to 456. It must be changed to **465** for the connection to succeed.

## 3. DNS Authentication (Cloudflare)
The following records are required in the Cloudflare DNS dashboard to authorize Resend to send emails for uomcc.org.

| Type | Name | Content |
|---|---|---|
| TXT | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDEuGApzj1Iw/hrU6X2pnKdp9UDsExdFqG/a2pcm0fJC42YHwiSRAw3/hrU6XpnKd9UDExdFqG/a2pcm0fJC42YHwiSRAzRY6vCQ0TbZMKQKmfJay/so0dLxz6iWi3GwdE901/AKBrxaLTzRounPRTP87FCE0WM+J4wQDN4+jI3pI3xgMKXu3bLhH5NHp6h0009dfIcLiwIDAQAB` |
| MX | `send` | `feedback-smtp.us-east-1.amazonses.com` (Priority: 10) |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` |
| TXT | `_dmarc` | `v=DMARC1; p=none;` |

## 4. Critical Outstanding Actions
To fully enable the server-side logic:
1. **Verify DNS in Cloudflare:** The records above must be manually added/verified in the Cloudflare DNS records.t
2. **Verify Domain in Resend:** Once DNS is updated, click Verify in the Resend Domains tab.
3. **Correct Supabase Port:** Change Port `456` to `465` in the Supabase SMTP Dashboard and click Save.
