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
src/app/api/[[...path]]/route.ts
  -> src/server/index.ts
  -> src/lib/api/root/server-app.ts
  -> src/lib/api/app/server-app.ts
  -> src/lib/api/profile/server-app.ts

src/app/api/auth/[...all]/route.ts
  -> toNextJsHandler(betterAuthServer)
```

The catch-all route file is intentionally thin. It only exports the HTTP methods that Next.js needs to register the URL and then delegates to the Hono-backed server handler.

## Guidance
Do not recreate one-file-per-endpoint route handlers for Hono-backed APIs. Add routes inside the matching Hono app instead:

| Public URL prefix | Add route in |
|---|---|
| `/api/join`, `/api/crawl`, `/api/handle/*` | `src/lib/api/root/app.ts` |
| `/api/me`, `/api/analytics`, `/api/create`, `/api/upload-input-images` | `src/lib/api/app/app.ts` |
| `/api/profile/*` | `src/lib/api/profile/app.ts` |

Keep request path normalization inside the server adapter:

```text
src/server/adapter.ts
```

The Hono API modules must not import from `src/app/api` or `@/app/api`. Types shared with API consumers belong under `src/lib/api/**`, for example `src/lib/api/app/types.ts`.

`src/lib/api/hono-factory.ts` owns the shared Hono factory, session middleware, authenticated-session context getter, JSON response helper, and no-store response helper. New Hono apps should use this shared factory rather than `new Hono()` directly.

`src/server/index.ts` owns route composition order. Mount the more specific `/api/profile` Hono app before the broader `/api` Hono app.

## Current Non-Hono API Boundaries
These route handlers are intentionally outside the Hono app-owned API boundary for now:

```text
src/app/api/auth/[...all]/route.ts
src/app/api/inngest/route.ts
src/app/api/webhooks/dodo/route.ts
src/app/api/webhooks/paddle/route.ts
src/app/api/webhooks/stripe/route.ts
```

Better Auth follows the official Next.js route handler integration with `toNextJsHandler(betterAuthServer)`. Keep it on `src/app/api/auth/[...all]/route.ts`; do not mount Better Auth behind Hono. Webhooks and Inngest have provider-specific body/signature/SDK contracts and should only move to Hono with dedicated parity tests.

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
- Better Auth stays on its official Next.js handler. This is the project boundary, not a temporary gap.
- Provider webhook route handlers stay provider-local until raw body and signature verification parity is proven.

## Verification
Use focused checks after changing the Hono boundary:

```bash
bun test src/lib/api/__test__/api-boundary.test.ts \
  src/lib/api/root/__test__/root-api.test.ts \
  src/lib/api/app/__test__/app-api.test.ts \
  src/lib/api/profile/__test__/profile-api.test.ts \
  src/app/api/__test__/root-route-adapter.test.ts \
  src/server/__test__/server-api.test.ts

bun x tsc --noEmit --pretty false --skipLibCheck --project tsconfig.json
bun run build
```

`bun run build` is required after route consolidation because stale `.next/types` or route conflicts may not be obvious from unit tests alone.

## Related
- `docs/plans/2026-05-02-001-refactor-hono-profile-api-plan.md`
- `docs/plans/2026-05-03-001-refactor-hono-better-auth-next-api-plan.md`
- `docs/solutions/best-practices/better-auth-supabase-rls-boundary-2026-04-28.md`
