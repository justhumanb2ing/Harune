---
title: Hono and Next.js API boundary
date: 2026-05-03
category: best-practices
module: api-architecture
problem_type: best_practice
component: api
severity: medium
applies_when:
  - Hono-backed API routes are added or refactored
  - Next.js App Router route handlers are consolidated
  - Better Auth, webhooks, or background-job endpoints are considered during API boundary work
tags: [hono, nextjs, app-router, api, better-auth]
---

# Hono and Next.js API boundary

## Context
Harune now uses Hono for the app-owned API composition layer while keeping Next.js App Router as the public URL owner. Hono-backed API route handlers are consolidated into one app-owned catch-all route handler:

```text
src/app/api/[...route]/route.ts
  -> src/lib/api/server/index.ts
  -> src/lib/api/services/auth-server.ts
  -> src/lib/api/services/root-server.ts
  -> src/lib/api/services/app-server.ts
  -> src/lib/api/services/profile-server.ts
```

The catch-all route file is intentionally thin. It exports the HTTP methods through `hono/vercel`'s `handle(routes)` adapter and delegates to the Hono-backed server handler.

## Guidance
Do not recreate one-file-per-endpoint route handlers for Hono-backed APIs. Add routes inside the matching Hono app instead:

| Public URL prefix | Add route in |
|---|---|
| `/api/auth/*` | `src/lib/api/routes/auth.ts` |
| `/api/join`, `/api/handle/*` | `src/lib/api/routes/root.ts` |
| `/api/me`, `/api/analytics`, `/api/create`, `/api/upload-input-images` | `src/lib/api/routes/app.ts` |
| `/api/profile/*` | `src/lib/api/routes/profile.ts` |

Metadata fetching now uses the `/metadata` transport in `src/lib/metadata/url-metadata.ts` and the generated HTTP client in `src/lib/api/generated/http/metadata-api/metadata-api.ts`. Keep that path as the only consumer-facing metadata fetch contract.

Keep request path normalization inside the server adapter:

```text
src/lib/api/server/adapter.ts
```

The Hono API modules must not import from `src/app/api` or `@/app/api`. Types shared with API consumers belong under `src/lib/api/**`, for example `src/lib/api/app/types.ts`.

`src/lib/api/hono-factory.ts` owns the shared Hono factory, JSON response helper, validators, and no-store response helper. `src/lib/api/middlewares/session.ts` owns session middleware and the authenticated-session context getter. New Hono apps should use these shared modules rather than `new Hono()` directly.

Keep Hono responsibility separated by folder:

```text
src/lib/api/routes          HTTP endpoint definitions and request/response assembly
src/lib/api/middlewares     auth/session and other cross-cutting Hono middleware
src/lib/api/schemas         input validation schemas used by routes
src/lib/api/services        use-case orchestration and production dependency wiring
src/lib/api/repositories    Drizzle DB reads/writes
```

Routes may call services and schemas, but they should not directly import Drizzle tables or mutate the DB. Repositories may import `@/db` and schema tables, but they should not import Hono context, route helpers, or Next route handlers.

`src/lib/api/server/index.ts` owns route composition order. Mount Better Auth first, then `/api/profile` and root-owned `/api/*` routes before the broader app `/api` Hono app.

## Current Non-Hono API Boundaries
These route handlers are intentionally outside the Hono app-owned API boundary for now:

```text
src/app/api/inngest/route.ts
src/app/api/webhooks/dodo/route.ts
src/app/api/webhooks/paddle/route.ts
src/app/api/webhooks/stripe/route.ts
```

Better Auth is mounted inside the single Hono server app through its official Hono handler pattern:

```text
src/lib/api/routes/auth.ts
  -> betterAuthServer.handler(context.req.raw)
```

Webhooks and Inngest have provider-specific body/signature/SDK contracts and should only move to Hono with dedicated parity tests.

The retired profile routes below should not be restored unless product scope explicitly reopens them:

```text
src/app/api/profile/playlist/route.ts
src/app/api/profile/social-links/route.ts
src/app/api/profile/social-links/[socialLinkId]/route.ts
src/app/api/profile/social-links/reorder/route.ts
```

## Invariants
- Next.js route handlers own public URL registration only.
- Hono apps own app-owned API business logic, validation, auth checks, no-store JSON contracts, and error mapping.
- Hono-backed API code never imports from `src/app/api`.
- Profile-page sync endpoints must preserve committed-read response semantics and no-store behavior.
- Better Auth stays on `/api/auth/*`, but it is served by the Hono catch-all route rather than a separate Next route handler.
- Provider webhook route handlers stay provider-local until raw body and signature verification parity is proven.

## Verification
Use focused checks after changing the Hono boundary:

```bash
bun test src/lib/api/__test__/api-boundary.test.ts \
  src/lib/api/root/__test__/root-api.test.ts \
  src/lib/api/app/__test__/app-api.test.ts \
  src/app/api/__test__/root-route-adapter.test.ts \
  src/lib/api/server/__test__/server-api.test.ts \
  src/lib/profile/__test__/profile-cache-regression.test.ts

bun x tsc --noEmit --pretty false --skipLibCheck --project tsconfig.json
bun run build
```

`bun run build` is required after route consolidation because stale `.next/types` or route conflicts may not be obvious from unit tests alone.

## Related
- `docs/plans/2026-05-02-001-refactor-hono-profile-api-plan.md`
- `docs/plans/2026-05-03-001-refactor-hono-better-auth-next-api-plan.md`
- `docs/solutions/best-practices/better-auth-supabase-rls-boundary-2026-04-28.md`
- `docs/solutions/best-practices/api-me-app-context-contract-2026-05-07.md`
