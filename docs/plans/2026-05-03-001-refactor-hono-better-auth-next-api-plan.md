---
title: Hono, Better Auth, and Next.js full API transition plan
date: 2026-05-03
module: api-architecture
problem_type: refactor_plan
tags: [hono, better-auth, nextjs, app-router, api]
---

# Hono, Better Auth, and Next.js API Transition Plan

> Updated current state: Better Auth is now mounted through the single Hono catch-all via `src/lib/api/routes/auth.ts`. The old `src/app/api/auth/[...all]/route.ts` exception has been removed.

## Decision Summary
Move Harune toward one Hono-composed app API runtime mounted through a single Next.js catch-all route handler, including Better Auth through its Hono handler mount.

The target shape is not “remove all Next.js route handlers.” Next.js still needs route handler files to register public URLs. The target is:

```text
Next.js catch-all route handler
  -> Hono/Vercel adapter or local Hono fetch adapter
  -> one typed Hono server app
  -> domain route modules
```

Better Auth is part of the Hono migration target. It is mounted as:

```text
src/app/api/[...route]/route.ts
  -> src/lib/api/server/index.ts
  -> src/lib/api/routes/auth.ts
  -> betterAuthServer.handler(context.req.raw)
```

This follows Better Auth's official Hono integration pattern for `auth.handler(c.req.raw)`.

## References
- Better Auth official Hono integration mounts auth with `app.on(["POST", "GET"], "/api/auth/*", c => auth.handler(c.req.raw))`.
- Better Auth official Next.js docs note that `nextCookies()` should be the last plugin when server actions or server calls need to set cookies.
- Better Auth official Next.js docs recommend cookie-only checks in proxy for optimistic redirects and server-side session validation in pages/routes for protected actions.
- Hono docs include a Next.js getting-started path and Vercel adapter support. Harune now uses `hono/vercel` in the single catch-all route and keeps request normalization inside the server fetch boundary.

## Current State
Current route ownership:

```text
src/app/api/[...route]/route.ts
  -> single server Hono API
  -> auth/root/app/profile Hono routes

src/app/api/inngest/route.ts
  -> Inngest handler

src/app/api/webhooks/*/route.ts
  -> provider-specific webhook handlers
```

Retired routes:

```text
/api/profile/playlist
/api/profile/social-links
/api/profile/social-links/[socialLinkId]
/api/profile/social-links/reorder
```

Shared Hono infrastructure:

```text
src/lib/api/hono-factory.ts
src/lib/api/routes/*
src/lib/api/services/*
src/lib/api/repositories/*
src/lib/api/server/index.ts
```

## Target Architecture
Preferred target after the remaining migrations:

```text
src/lib/api/server/
  index.ts
  adapter.ts
  create-server-api.ts

src/app/api/[[...route]]/route.ts
  -> export HTTP methods from handle(serverRoutes)

```

Keep API server composition under `src/lib/api/server`. A separate top-level `src/server` folder is unnecessary unless non-API server runtimes appear.

## Migration Phases

### Phase 1: Stabilize Current Hono Boundary
Goal: lock in the current catch-all structure before moving auth or provider endpoints.

Tasks:
- Keep `src/lib/api/__test__/api-boundary.test.ts` as the guard that prevents `src/lib/api/**` from importing `src/app/api`.
- Add docs/solution coverage for catch-all route ownership.
- Keep route manifest verification through `bun run build`.
- Ensure retired `playlist` and `social-links` route paths stay absent.

Exit criteria:
- API boundary tests pass.
- TypeScript passes after a clean `.next/types`.
- Build route manifest shows only Hono catch-all routes plus intentional non-Hono routes.

### Phase 2: Introduce a Single Hono Server App
Status: implemented for app-owned API route composition.

Goal: replace multiple prefix-specific Next.js catch-all handlers with one typed Hono server app.

Tasks:
- Create `src/lib/api/server/index.ts`.
- Mount existing route modules under one Hono app.
- Replace three catch-all route handlers with one `src/app/api/[...route]/route.ts`.
- Mount Better Auth inside the server Hono app before broader `/api` routes.

Exit criteria:
- No public URL changes.
- Hono route contract tests still call the app directly.
- `src/lib/api/server/__test__/server-api.test.ts` verifies profile route precedence over broader app routes.
- App Router catch-all route file remains thin.

### Phase 3: API Server Composition Consolidation
Goal: keep Hono server composition colocated with the rest of `src/lib/api/**`.

Target:

```ts
src/lib/api/server/
  index.ts
  adapter.ts
  create-server-api.ts
```

Tasks:
- Do not create a top-level `src/server` folder while this runtime only serves API composition.
- Preserve direct Hono route contract tests during any file move.
- Keep shared client/server response types in a location that does not force UI code to import from server-only modules.

Exit criteria:
- No public URL changes.
- No `src/app/api` imports from Hono API modules.
- Route manifest still shows one app-owned catch-all API entry plus official/special route handlers.

### Phase 4: Better Auth Hono Mount
Goal: keep `/api/auth/*` on the single Hono catch-all route.

Keep the Hono mount:

```ts
routes.on(["GET", "POST"], "/api/auth/*", (context) => {
  return betterAuthServer.handler(context.req.raw);
});
```

Boundary tests:
- `GET /api/auth/ok` returns the expected health response.
- `src/app/api/auth/[...all]/route.ts` does not exist.
- The Hono server routes `/api/auth/*` before broader app API routes.
- `nextCookies()` remains the last plugin and server-side auth calls still set cookies where expected.

Exit criteria:
- Build route manifest includes `/api/[...route]` and no separate `/api/auth/[...all]`.
- Tests assert the Better Auth route is handled by the Hono server app.

### Phase 5: Webhook Hono Migration
Goal: move provider webhooks only if raw body/signature contracts are preserved.

Tasks:
- For Stripe, Paddle, and Dodo, write tests that verify raw request body is passed to the signature verifier unchanged.
- Move one webhook provider at a time into `src/lib/api/routes/webhooks/*`.
- Preserve provider status codes, retry semantics, and logging.

Exit criteria:
- Provider webhook tests pass with raw-body fixtures.
- Build route manifest no longer lists provider-specific route handlers if migrated.

### Phase 6: Inngest Boundary Decision
Goal: decide whether Inngest should remain framework-owned or become Hono-owned.

Default recommendation:
- Keep Inngest on its official handler unless the Inngest SDK supports the exact Hono/Fetch mount pattern without losing signature, serve path, or dev-server behavior.

Exit criteria:
- Either official-handler exception is documented, or a Hono parity test proves equivalent behavior.

## Risks
- Better Auth cookie or OAuth behavior can regress if the Hono mount does not pass the raw `Request` to `betterAuthServer.handler`.
- Webhook signature verification can break if body parsing changes.
- A single `/api/[...route]` catch-all can accidentally intercept routes that should remain provider-owned.
- `.next/types` can cache deleted route files; clean `.next/types` before interpreting TypeScript failures after route deletions.

## Verification Matrix

```bash
bun test src/lib/api/__test__/api-boundary.test.ts
bun test src/lib/api/root/__test__/root-api.test.ts
bun test src/lib/api/app/__test__/app-api.test.ts
bun test src/lib/api/profile/__test__/profile-api.test.ts
bun test src/app/api/__test__/root-route-adapter.test.ts
bun test src/app/api/app/__test__/app-route-adapter.test.ts
bun test src/app/api/profile/__test__/handle-availability-route.test.ts
bun test src/lib/api/server/__test__/server-api.test.ts
bun x tsc --noEmit --pretty false --skipLibCheck --project tsconfig.json
bun run build
```

Before interpreting TypeScript failures after deleting or moving route files, clean stale Next generated types:

```bash
rm -rf .next/types
```

Then re-run TypeScript and build so the route manifest reflects current source files.

## Stop Rules
- Do not add a separate `src/app/api/auth/[...all]/route.ts`; keep Better Auth under the single Hono catch-all.
- Do not move webhooks behind Hono if raw-body signature verification is not proven.
- Do not remove Next.js route handlers entirely; keep at least one catch-all route handler for public URL registration.
- Do not claim performance wins without measurement. Treat this migration as architecture, testability, and route ownership cleanup first.
