# Daily Mood Tracker Deployment Plan

## Objective and Success Criteria
- Publish the existing Vite/React app in `client/` with a secure backend so users can log their moods from any device.
- Guarantee private, per-user storage with authentication, encrypted transport, and automated backups.
- Provide an observable deployment pipeline (tests, preview builds, monitoring) so regressions are caught before production.

## Current State Snapshot
- Frontend: Vite + React 19 + Tailwind, all code lives under `client/`. State and analytics are currently computed on the client and persisted to `localStorage`.
- No backend, no authentication, no centralized data model.
- Deployment target not yet defined; repo only contains the SPA.

## Target Architecture Overview
- **Client:** React UI served from Vercel. Either migrate to Next.js (frontend + API in a single repo) or continue shipping the Vite bundle.
- **API:** Node-based layer hosting CRUD endpoints plus analytics (Next.js API routes, Vercel Functions, or a Fastify/Express service).
- **Database:** Managed Postgres (Vercel Postgres, Neon, Supabase, Railway) for structured entries, users, and derived aggregates.
- **Auth:** Session-based auth via NextAuth (with OAuth/email providers) or Supabase Auth. Issue HTTP-only cookies and gate all endpoints.
- **Observability:** Hosted logging (Vercel logs, Logtail), uptime monitoring, and automated backups.

### Recommended Stack Choices
1. **Preferred (Single deployment):** Migrate the app to Next.js 15 App Router. Host on Vercel, keep the React components largely intact, add Prisma as the ORM, NextAuth with OAuth/email magic links, and Vercel Postgres.
2. **Alternative (Keep Vite build):** Continue using the Vite SPA served from Vercel static hosting or Netlify. Stand up a Fastify service on Fly.io/Render with Prisma + Neon. Expose REST endpoints and configure CORS. This maintains the current project layout if migration time is limited.

## Infrastructure Setup Steps
1. **Create Vercel project(s):** One for production, optionally one for staging. Connect to the GitHub repo so pushes to `main` deploy automatically.
2. **Provision the database:** Pick Neon/Vercel Postgres; create production + staging databases; enable daily backups and PITR.
3. **Secret management:** Store `DATABASE_URL`, `NEXTAUTH_SECRET`, OAuth keys, analytics keys in Vercel Environment Variables. Mirror them locally via `.env.local` (never commit).
4. **Networking/security:** Enforce TLS, restrict DB access to platform IPs, enable row-level security if using Supabase.
5. **Monitoring:** Configure Vercel Analytics or a third-party (Highlight/Sentry) plus health checks on the API route.

## Data Model & Migration Plan
- Tables:
  - `users (id uuid pk, email text unique, display_name text, created_at timestamptz)`
  - `mood_entries (id uuid pk, user_id uuid fk, entry_date date, primary_mood text, secondary_mood text, notes text, created_at timestamptz, updated_at timestamptz)`
  - `aggregates (user_id uuid fk, year int, stats jsonb, computed_at timestamptz)` optional cache.
- Tooling: Prisma or Drizzle for schema definition + migrations. Run `prisma migrate deploy` during each release.
- Seed: Provide a script to import legacy localStorage data for early adopters (JSON import endpoint).

## Backend/API Workstream
1. Scaffold API routes (`GET/POST /api/entries`, `PUT/DELETE /api/entries/:id`, `GET /api/entries/calendar?year=2024`, `GET /api/stats/yearly`).
2. Centralize validation with Zod; reject malformed payloads.
3. Implement per-user filtering at the SQL layer (`WHERE user_id = session.userId`).
4. Add rate limiting (Upstash Redis or Vercel Edge Middleware) to defend against abuse.
5. Introduce integration tests covering CRUD + auth checks (Vitest, Jest, or Next test runner).

## Frontend (client/) Updates
1. Replace the `localStorage` helpers (`loadEntries`, `saveEntries`) with hooks that call the API via React Query or SWR. Maintain optimistic updates so the UI stays responsive.
2. Add authentication-aware routing (e.g., Next.js middleware or React Router guard). Redirect unauthenticated users to the sign-in page.
3. Show sync states (loading, offline, error). Queue writes offline and replay when online if necessary.
4. Update analytics views (OverviewPanel) to consume API-provided aggregates; fall back to client-side computation as a stopgap.
5. Introduce feature flags/env checks so the build can run against staging vs. production endpoints.

## Authentication & Authorization
1. Choose a provider:
   - NextAuth with email magic links + Google.
   - Supabase Auth if using Supabase DB.
2. Implement the auth flow (sign-in page, callback handler, protected API routes).
3. Issue secure cookies (SameSite=Lax, HTTP-only). Enforce HTTPS-only deployments.
4. Add per-session CSRF protection for mutation routes.

## Deployment Workflow & Environments
1. **Branches:** `main` (production), `develop` (integration), feature branches with preview deployments enabled in Vercel.
2. **CI:** GitHub Actions pipeline:
   - `pnpm install --frozen-lockfile`
   - `pnpm lint && pnpm test`
   - Optional `pnpm build` to ensure the bundle compiles.
3. **Previews:** Every PR deploys to Vercel Preview with staging env vars + staging DB.
4. **Release:** Merge to `main` triggers production deploy. Run migrations via `prisma migrate deploy` prior to promoting the new build.

## Testing & Quality Gates
- Unit tests for utilities (`client/src/utils`) already exist; expand coverage for API handlers and hooks.
- Add integration tests hitting the deployed staging API (Playwright/Cypress) to ensure auth + CRUD flows work.
- Load-test API endpoints using k6 or Artillery to validate DB sizing (target: 100 RPS baseline).
- Post-deploy smoke test script verifying login, entry creation, overview rendering.

## Operations, Monitoring, and Maintenance
- Enable Vercel Analytics, connect to Sentry/Highlight for client + server error tracking.
- Database monitoring: configure Neon alerts for connection saturation and storage usage.
- Backups: daily automatic snapshots plus retention policy (30 days). Document restore-handbook.
- Logging: centralize API logs (Vercel / Fly) and set alert thresholds on 5xx error rates.

## Work Breakdown & Sequencing
1. **Week 1 – Foundations:** Choose architecture option, scaffold Next.js (or API service), set up repo structure, configure Vercel + DB.
2. **Week 2 – Data & Auth:** Implement Prisma models, migrations, and NextAuth; deploy staging instance.
3. **Week 3 – API & Client Integration:** Build CRUD endpoints, refactor `client/` components to consume them, add React Query.
4. **Week 4 – Hardening:** Write integration/E2E tests, add rate limiting, configure monitoring, run load tests.
5. **Week 5 – Production Rollout:** Final data migration, enable production env vars, perform smoke tests, announce GA.

## Risks & Mitigation
- **User data privacy:** Mitigate with enforced auth, encrypted channels, DB row-level security.
- **Vendor lock-in:** Use Prisma + Postgres to keep portability between Neon/Vercel/Railway.
- **Offline gaps:** Consider keeping a minimal local cache synced with the API to avoid regressions in UX.
- **Migration regressions:** Gate rollout behind feature flags; allow beta testers to switch between local and remote storage.

## Definition of Done
- All CRUD/API/auth flows verified on staging and production.
- Automated CI/CD in place with lint/tests/build checks blocking merges that fail.
- Monitoring, logging, and backup alerts configured.
- Documentation updated (README + runbooks) so contributors can operate the system end-to-end.
