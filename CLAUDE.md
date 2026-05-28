# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev       # start dev server on localhost:3000
npm run build     # production build
npm run lint      # eslint
```

## Architecture

This is a VM control panel — a Next.js frontend on Vercel that proxies commands to a local Mac agent (`~/vm-agent/agent.js`) through a Cloudflare Tunnel.

```
Browser → Vercel (Next.js) → Cloudflare Tunnel (x542c18.lamfamily.cloud) → vm-agent (:3456) → prlctl → Parallels
```

**Auth:** NextAuth v5 credentials provider. Two users defined entirely via env vars (`USER1_NAME`, `USER1_PASS_HASH`, `USER2_NAME`, `USER2_PASS_HASH`). No database. JWT sessions. `auth.ts` at repo root exports `{ handlers, signIn, signOut, auth }`. Middleware in `middleware.ts` protects all routes except `/login` and `/api/auth`.

**API routes** (`src/app/api/vm/`): Each route checks `auth()` then proxies to `AGENT_URL` with `x-agent-secret` header. Routes: `status` (GET), `start` (POST), `stop` (POST), `kill` (POST), `screenshot` (GET).

**Frontend** (`src/app/`): `page.tsx` is a server component that checks auth and renders the `VMCard` client component. All interactivity (polling, buttons, screenshot) lives in `vm-card.tsx`.

**VM naming:** The UI and API routes use `macvm` as the display/endpoint name. The agent maps this to the actual Parallels VM name `jaivm` via the `VM_NAME` constant in `agent.js`. Do not change prlctl calls to use `macvm`.

## Environment variables

Required on Vercel: `AUTH_SECRET`, `AGENT_URL`, `AGENT_SECRET`, `USER1_NAME`, `USER1_PASS_HASH`, `USER2_NAME`, `USER2_PASS_HASH`.

Generate password hashes: `node -e "require('bcryptjs').hash('password', 12).then(console.log)"`

## vm-agent (not in this repo)

Located at `~/vm-agent/agent.js`. Managed by launchd (`~/Library/LaunchAgents/com.immanuellam.vm-agent.plist`). Restart after changes: `launchctl stop com.immanuellam.vm-agent && launchctl start com.immanuellam.vm-agent`.
