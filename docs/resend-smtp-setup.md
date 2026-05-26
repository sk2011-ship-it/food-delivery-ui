# Resend SMTP Setup for Supabase Auth Emails

## Why

Supabase free plan limits auth emails to 2/hour. Using Resend as custom SMTP removes this limit.

## Resend Account

- **Domain**: yourlocaleats.app
- **Region**: Ireland (eu-west-1)
- **API Key env var**: `RESEND_API_KEY`

## DNS Records (Namecheap)

These records are already added in Namecheap Advanced DNS:

| Type | Host | Value |
|------|------|-------|
| TXT | `resend._domainkey` | DKIM public key |
| MX | `send` | `feedback-smtp.eu-west-1.amazonses.com` (priority 10) |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` |
| TXT | `_dmarc` | `v=DMARC1; p=none;` |

## Supabase Custom SMTP Config

Go to **Supabase Dashboard > Authentication > SMTP Settings > Enable custom SMTP**:

| Field | Value |
|-------|-------|
| Sender email address | `noreply@yourlocaleats.app` |
| Sender name | `YourLocalEats` |
| Host | `smtp.resend.com` |
| Port number | `465` |
| Minimum interval per user | `60` |
| Username | `resend` |
| Password | Use `RESEND_API_KEY` from `.env` |

## Notes

- This applies to ALL Supabase auth emails: signup confirmation, password reset, magic links, email change
- Email templates can be customized in **Supabase > Authentication > Email Templates**
- If switching Supabase projects, repeat the SMTP config in the new project dashboard
