# VM Control

Web UI to start, stop, and preview a Parallels VM remotely. Hosted on Vercel, talks to a local agent on the Mac via Cloudflare Tunnel.

## Architecture

```
Browser → Vercel (Next.js) → Cloudflare Tunnel → vm-agent (localhost:3456) → prlctl → Parallels
```

- **Vercel** — hosts the frontend and API routes. Handles authentication.
- **Cloudflare Tunnel** — exposes the local agent at `x542c18.lamfamily.cloud` without port forwarding.
- **vm-agent** — small Express server on the Mac. Only accepts requests with the correct secret header. Runs `prlctl` to control Parallels.

## Directories

| Path | What it is |
|------|------------|
| `~/vmwebui` | This repo — Next.js frontend deployed to Vercel |
| `~/vm-agent` | Local agent running on the Mac |

## vm-agent

Located at `~/vm-agent`. Runs as a launchd service, starts automatically on login.

**Endpoints** (all require `x-agent-secret` header):
- `GET /jaivm/status` — returns `{ running: true/false }`
- `POST /jaivm/start` — starts the VM
- `POST /jaivm/stop` — graceful shutdown
- `POST /jaivm/kill` — force shutdown (pulls power)
- `GET /jaivm/screenshot` — captures via `prlctl capture`, compresses to JPEG 60%

**Service management:**
```bash
launchctl start com.immanuellam.vm-agent
launchctl stop com.immanuellam.vm-agent

# Check it's running
curl http://localhost:3456/jaivm/status -H "x-agent-secret: <secret>"

# Logs
tail -f ~/vm-agent/agent.log
```

**Plist:** `~/Library/LaunchAgents/com.immanuellam.vm-agent.plist`

## Cloudflare Tunnel

Tunnel name: **vm** in the Cloudflare One dashboard (`lamfamily.cloud` account).
- Routes `x542c18.lamfamily.cloud/*` → `http://localhost:3456`
- WAF custom rule skips the geo-block for requests that have the `x-agent-secret` header (Vercel's servers are in the US)

## Vercel environment variables

Set in the Vercel project under Settings → Environment Variables:

| Variable | Description |
|----------|-------------|
| `AUTH_SECRET` | Random secret for NextAuth JWT signing (`openssl rand -hex 32`) |
| `AGENT_URL` | `https://x542c18.lamfamily.cloud` |
| `AGENT_SECRET` | Must match the secret in the launchd plist |
| `USER1_NAME` | Username for first user |
| `USER1_PASS_HASH` | bcrypt hash of their password |
| `USER2_NAME` | Username for second user |
| `USER2_PASS_HASH` | bcrypt hash of their password |

**Generate a password hash:**
```bash
node -e "require('bcryptjs').hash('thepassword', 12).then(console.log)"
```

## Authentication

Two hardcoded users via env vars — no database. Sessions use JWT stored in a cookie. Login at `/login`.

## Adding a new VM

1. Add endpoints to `~/vm-agent/agent.js` (copy the existing `jaivm` routes, change the name)
2. Add API routes under `src/app/api/vm/` and update `src/app/vm-card.tsx`
3. Push to GitHub — Vercel redeploys automatically
