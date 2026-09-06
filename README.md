# Serene

Serene is a calm browser-based gaming, browsing, and utility platform. Its visual system is built around a near-black graphite environment, slow abstract light forms, subtle film grain, and a restrained adaptive accent color.

## Requirements

Node.js 22+ and pnpm 10+ are recommended for local development. The project is a static React frontend scaffolded with Vite, TypeScript, Tailwind CSS, Wouter, Lucide icons, and the provided UI primitives.

## Installation and development

```bash
pnpm install
pnpm dev
```

The frontend runs on Vite. The account system is served by the included Express server and stores account records in a local runtime JSON file for this build. For production, replace that file store with a real database and managed session infrastructure.

## Accounts, Stars, shop, and Google sign-in

The included account API supports email/password signup, username creation, login/logout, Google Identity Services sign-in, profiles, virtual Stars, daily Star claims, and Star purchases. Shop purchases unlock full-site themes, particle packs, profile frames, and avatar animations. Stars are virtual only; this build does not process real-money payments.

Set both `VITE_GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_ID` in your local environment to enable Google sign-in. The Google client ID is public configuration, but the server still verifies the returned Google ID token before creating a session. Keep all private credentials and signing secrets server-side.

## Production build

```bash
pnpm check
pnpm build
```

The deployment build is static frontend output served by the managed project runtime. Do not place large media files in `client/public`; generated visual assets are stored through the project asset lifecycle and referenced by their managed URLs.

## Environment variables

The checked-in `.env.example` is intentionally limited to placeholder names. Public `VITE_` variables must be treated as browser-visible. Do not place credentials, private tokens, or signing secrets in the frontend.

## Architecture

The application root wires `SereneProvider`, the animated `SereneBackground`, the responsive `AppShell`, and Wouter route components. Structured game and utility definitions live in `client/src/lib/data.ts`. User preferences are persisted through `client/src/contexts/SereneContext.tsx` using local storage for non-sensitive state such as theme, appearance, favorites, recent games, bookmarks, and browser history.

The visual system is documented in `ideas.md` under the **Luminous Quietude** direction. The background combines a generated cinematic atmosphere with GPU-friendly CSS transforms, color-tinted blurred forms, a vignette, and a subtle procedural grain layer. `prefers-reduced-motion` and the user setting both reduce non-essential motion.

## Browser architecture and Scramjet boundary

The browser UI is a modular shell with tabs, a new-tab page, address/search resolution, bookmarks, history, and safe external-destination handling. The official Scramjet project was inspected as requested; it is an experimental interception-based web proxy that requires a compatible service layer. This static frontend does not claim to bundle or imitate Scramjet. When external content does not allow embedded viewing, Serene presents a clean state and offers normal navigation in a new tab.

The browser is intended only for content the user is authorized to access. It must not be used to bypass school, workplace, parental, authentication, geographic, security, or network access controls.

## Security and privacy

No sensitive credentials are requested or stored. Local storage contains only non-sensitive preferences and local workspace state. The UI avoids raw stack traces and exposes no source viewer, server credentials, environment files, or private implementation details.

## Third-party acknowledgements

Serene uses React, Vite, TypeScript, Wouter, Lucide icons, Tailwind CSS, Framer Motion-compatible project dependencies, and the provided UI primitives. Generated imagery is project-owned through the managed asset lifecycle. The Scramjet reference is documented in `scramjet-notes.md` and the official repository is linked from the uploaded brief.
