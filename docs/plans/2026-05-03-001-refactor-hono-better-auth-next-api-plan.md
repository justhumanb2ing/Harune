---
title: Hono, Better Auth, and Next.js full API transition plan
date: 2026-05-03
module: api-architecture
problem_type: refactor_plan
tags: [hono, better-auth, nextjs, app-router, api]
---

# Hono, Better Auth, and Next.js API Transition Plan

## Decision Summary
Move Harune toward one Hono-composed app API runtime mounted through Next.js catch-all route handlers, while keeping Better Auth on its official Next.js route handler integration.

The target shape is not “remove all Next.js route handlers.” Next.js still needs route handler files to register public URLs. The target is:

```text
Next.js catch-all route handler
  -> Hono/Vercel adapter or local Hono fetch adapter
  -> one typed Hono server app
  -> domain route modules
```

Better Auth is not part of the Hono migration target. It remains:

```text
src/app/api/auth/[...all]/route.ts
  -> toNextJsHandler(betterAuthServer)
```

This follows Better Auth's official Next.js integration recommendation and avoids replacing framework-specific cookie/OAuth behavior with a custom Hono mount.

## References
- Better Auth official Next.js integration recommends mounting auth at `/api/auth/[...all]` with `toNextJsHandler(auth)`.
- Better Auth official Next.js docs note that `nextCookies()` should be the last plugin when server actions or server calls need to set cookies.
- Better Auth official Next.js docs recommend cookie-only checks in proxy for optimistic redirects and server-side session validation in pages/routes for protected actions.
- Hono docs include a Next.js getting-started path and Vercel adapter support. Leeve currently uses local `app.fetch()` adapters rather than `hono/vercel` directly.

## Current State
Current route ownership:

```text
src/app/api/[[...path]]/route.ts
  -> single server Hono API
  -> root/app/profile Hono routes

src/app/api/auth/[...all]/route.ts
  -> Better Auth official toNextJsHandler

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
src/lib/api/root/*
src/lib/api/app/*
src/lib/api/profile/*
src/server/index.ts
```

## Target Architecture
Preferred target after the remaining migrations:

```text
src/server/
  index.ts
  hono-factory.ts
  middleware/
    auth-session.ts
    errors.ts
    no-store.ts
    request-id.ts
  routes/
    root.ts
    app.ts
    profile.ts
    webhooks/
      dodo.ts
      paddle.ts
      stripe.ts

src/app/api/[[...route]]/route.ts
  -> export HTTP methods from handle(serverRoutes)

src/app/api/auth/[...all]/route.ts
  -> export GET/POST from toNextJsHandler(betterAuthServer)
```

Use `src/server` only when the API is truly app-wide. Until then, `src/lib/api/**` remains acceptable and already matches current ownership.

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
- Create `src/server/index.ts`.
- Mount existing route modules under one Hono app.
- Replace three catch-all route handlers with one `src/app/api/[[...path]]/route.ts`.
- Keep Better Auth on `src/app/api/auth/[...all]/route.ts`.

Exit criteria:
- No public URL changes.
- Hono route contract tests still call the app directly.
- `src/server/__test__/server-api.test.ts` verifies profile route precedence over broader app routes.
- App Router catch-all route file remains thin.

### Phase 3: Optional Server Folder Consolidation
Goal: decide whether to move `src/lib/api/**` implementation files under `src/server/**`.

Target:

```ts
src/server/
  index.ts
  hono-factory.ts
  routes/
    root.ts
    app.ts
    profile.ts
```

Tasks:
- Move only when `src/lib/api/**` no longer describes ownership clearly.
- Preserve direct Hono route contract tests during any file move.
- Keep shared client/server response types in a location that does not force UI code to import from server-only modules.

Exit criteria:
- No public URL changes.
- No `src/app/api` imports from Hono API modules.
- Route manifest still shows one app-owned catch-all API entry plus official/special route handlers.

### Phase 4: Lock the Better Auth Official Boundary
Goal: make the official Next.js Better Auth route a permanent exception to the Hono app API runtime.

Keep:

```ts
import { toNextJsHandler } from "better-auth/next-js";
import { betterAuthServer } from "@/auth";

export const { GET, POST } = toNextJsHandler(betterAuthServer);
```

Do not replace this with:

```ts
routes.on(["GET", "POST"], "/auth/*", (context) => {
  return betterAuthServer.handler(context.req.raw);
});
```

That Hono mount is similar to the referenced GitHub pattern, but it bypasses the official `toNextJsHandler` wrapper. Harune should follow the official Better Auth + Next.js path here.

Boundary tests:
- `GET /api/auth/ok` returns the expected health response.
- `src/app/api/auth/[...all]/route.ts` contains `toNextJsHandler(betterAuthServer)`.
- The Hono catch-all route must not intercept `/api/auth/*`.
- `nextCookies()` remains the last plugin and server-side auth calls still set cookies where expected.

Exit criteria:
- Build route manifest includes `/api/auth/[...all]`.
- Tests assert the Better Auth route remains on the official Next.js handler.
- No Hono route module imports or mounts `betterAuthServer.handler` for `/api/auth/*`.

### Phase 5: Webhook Hono Migration
Goal: move provider webhooks only if raw body/signature contracts are preserved.

Tasks:
- For Stripe, Paddle, and Dodo, write tests that verify raw request body is passed to the signature verifier unchanged.
- Move one webhook provider at a time into `src/server/routes/webhooks/*`.
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
- Better Auth cookie or OAuth behavior can regress if `toNextJsHandler` is replaced with a custom Hono mount.
- Webhook signature verification can break if body parsing changes.
- A single `/api/[[...route]]` catch-all can accidentally intercept routes that should remain provider-owned.
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
bun test src/server/__test__/server-api.test.ts
bun x tsc --noEmit --pretty false --skipLibCheck --project tsconfig.json
bun run build
```

Before deleting or moving route files, run:

```bash
rm -rf .next/types
```

Then re-run TypeScript and build so the route manifest reflects current source files.

## Stop Rules
- Do not move Better Auth behind Hono. Keep `toNextJsHandler(betterAuthServer)` as the official integration boundary.
- Do not move webhooks behind Hono if raw-body signature verification is not proven.
- Do not remove Next.js route handlers entirely; keep at least one catch-all route handler for public URL registration.
- Do not claim performance wins without measurement. Treat this migration as architecture, testability, and route ownership cleanup first.
