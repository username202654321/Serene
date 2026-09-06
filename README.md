# Serene

Serene is a calm browser-based gaming, browsing, and utility platform. Its visual system is built around a near-black graphite environment, slow abstract light forms, subtle film grain, and a restrained adaptive accent color.

## Requirements

Node.js 22+ and pnpm 10+ are recommended for local development. The project is a static React frontend scaffolded with Vite, TypeScript, Tailwind CSS, Wouter, Lucide icons, and the provided UI primitives.

## Installation and development

```bash
pnpm install
pnpm db:migrate
pnpm dev
```

The frontend runs on Vite on port 3000 and the development API runs on Express on port 3001. Vite proxies `/api/*` to Express. Run `pnpm db:migrate` once against the configured Postgres database before creating accounts.

## Accounts, Stars, shop, and Google sign-in

The included account API supports email/password signup, username creation, login/logout, Google Identity Services sign-in, profiles, virtual Stars, daily Star claims, and Star purchases. Shop purchases unlock full-site themes, particle packs, profile frames, and avatar animations. Stars are virtual only; this build does not process real-money payments.

Set `VITE_GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_ID` to the supplied Google client ID to enable Google Identity Services sign-in. The browser receives only the client ID; the server verifies the returned ID token. `GOOGLE_CLIENT_SECRET` is server-only and must never be prefixed with `VITE_` or placed in client code. `OWNER_EMAIL` identifies the initial server-side owner account.

## Production build

```bash
pnpm check
pnpm build
```

The deployment build is static frontend output served by the managed project runtime. Do not place large media files in `client/public`; generated visual assets are stored through the project asset lifecycle and referenced by their managed URLs.

Vercel uses `api/index.ts` for the Express API and `vercel.json` for the Vite output and SPA fallback. Run the migration from a trusted deployment/admin environment before first use.

## Environment variables

Required Vercel variables:

- `DATABASE_URL` or `POSTGRES_URL`: pooled production Postgres connection string.
- `GOOGLE_CLIENT_ID`: server-side Google client ID used to verify GIS credentials.
- `GOOGLE_CLIENT_SECRET`: server-only Google OAuth secret. It is not sent to the browser.
- `OWNER_EMAIL`: email that receives the `owner` role when its account is created.
- `VITE_GOOGLE_CLIENT_ID`: public Google client ID used by the browser GIS widget.
- `VITE_SCRAMJET_PROXY_URL`: optional authorized Scramjet runtime URL template containing `{url}`. Serene does not ship a proxy or use Scramjet to bypass access controls; when unset, Browser only directly embeds destinations that permit framing.

Public `VITE_` variables must be treated as browser-visible. Do not place credentials, private tokens, or signing secrets in the frontend.

## Architecture

The application root wires `SereneProvider`, the animated `SereneBackground`, the responsive `AppShell`, and Wouter route components. Structured game and utility definitions live in `client/src/lib/data.ts`. Durable accounts, profiles, sessions, Stars transactions, purchases, catalog records, Studio submissions, announcements, chat records, notifications, bookmarks, and settings have Postgres tables in `migrations/0000_serene_foundation.sql`. Anonymous visual preferences remain local to the device.

The visual system is documented in `ideas.md` under the **Luminous Quietude** direction. The background combines a generated cinematic atmosphere with GPU-friendly CSS transforms, color-tinted blurred forms, a vignette, and a subtle procedural grain layer. `prefers-reduced-motion` and the user setting both reduce non-essential motion.

## Browser architecture and Scramjet boundary

The browser UI is a modular shell with tabs, a new-tab page, address/search resolution, bookmarks, history, and safe external-destination handling. The official Scramjet project was inspected as requested; it is an experimental interception-based web proxy that requires a compatible service layer. This static frontend does not claim to bundle or imitate Scramjet. When external content does not allow embedded viewing, Serene presents a clean state and offers normal navigation in a new tab.

The browser is intended only for content the user is authorized to access. It must not be used to bypass school, workplace, parental, authentication, geographic, security, or network access controls.

## Security and privacy

No sensitive credentials are requested or stored. Local storage contains only non-sensitive preferences and local workspace state. The UI avoids raw stack traces and exposes no source viewer, server credentials, environment files, or private implementation details.

## Third-party acknowledgements

Serene uses React, Vite, TypeScript, Wouter, Lucide icons, Tailwind CSS, Framer Motion-compatible project dependencies, and the provided UI primitives. Generated imagery is project-owned through the managed asset lifecycle. The Scramjet reference is documented in `scramjet-notes.md` and the official repository is linked from the uploaded brief.
