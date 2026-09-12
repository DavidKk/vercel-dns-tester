---
name: dns-signet-login
description: Signet third-party login for DoH Tester. Use when configuring SIGNET_SDK_URL, ALLOWED_REDIRECT_URLS, or debugging /api/auth/signet flows.
---

# DNS Tester — Signet login

## Flow

1. User clicks **Sign in with Signet** on `/login` → `GET /api/auth/signet/start?redirectUrl=...`
2. App sets `signet_auth_state` cookie and redirects to Signet `/login`
3. Signet returns to `GET /api/auth/signet/callback?token=&state=`
4. Server loads hosted SDK, verifies token, issues `auth_token` httpOnly cookie

## Env (see `.env.example`)

| Variable         | Purpose                                                                                                                                                     |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SIGNET_SDK_URL` | Hosted `signet-client.mjs` URL; auth center origin is parsed from this URL. Omit or leave empty to disable Signet login. Audience is fixed to `dns-tester`. |

## Signet server

Whitelist this app's callback origin in Signet `ALLOWED_REDIRECT_URLS`, e.g. `https://your-dns-tester.example.com`.

## MCP

Use `@mcp/signet` tools: `signet_get_integration_guide`, `signet_build_login_url`, `signet_validate_redirect_url`.
