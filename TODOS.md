# TODOS

## Hono Profile Page API Migration

### POST Mutation Route Follow-Up

Status: completed for this pass.

**What:** After the first Hono-backed `handle-availability` route lands, migrate a small POST mutation route such as `links/route.ts`.

**Why:** The first route validates the Hono app, auth middleware, query validation, domain error mapping, and adapter contract. A second POST route should verify JSON body validation and mutation error handling before sync or upload routes move.

**Context:** Keep Better Auth on `toNextJsHandler` and keep playlist and social-links out of the migration scope. Do not move profile-page sync or media upload until Hono app tests and adapter route tests prove the contract is stable. After links/text route families, move only the `/api/app/profile-page` metadata read/update route in this pass.

**Effort:** M
**Priority:** P2
**Depends on:** `handle-availability` Hono migration and contract tests

## Profile Page Media Bento

### Magic Byte Verification for Uploaded Media

**What:** Add server-side magic byte verification for uploaded image and video media.

**Why:** MIME type and extension checks can be spoofed, so public media upload needs a stronger verification path if abuse risk increases.

**Context:** Single media bento v1 validates auth, MIME, size, key prefix, and R2 ownership. This hardening should inspect file signatures in the upload Route Handler before `PutObject`, using small test fixtures for allowed and rejected files.

**Effort:** M
**Priority:** P2
**Depends on:** Media upload Route Handler implementation

### Scheduled Cleanup for Abandoned Temporary Media Objects

**What:** Add an operational cleanup path for abandoned temporary media objects.

**Why:** Users can upload a temp object and close the tab before save/finalize, leaving `tmp/users/{userId}/profile-page/bento/{safeBentoId}/media` objects that finalize-time cleanup never sees.

**Context:** Media bento v1 should delete temp objects after successful finalize, but scheduled cleanup remains deferred. Cleanup should delete only temp objects older than a conservative threshold and should log deletion failures without blocking normal app behavior.

**Effort:** M
**Priority:** P2
**Depends on:** Media temp key format and R2 list/delete helper

### Media Asset Library and Gallery Expansion

**What:** Explore an asset library, gallery, media picker, video poster generation, and multi-asset media bento.

**Why:** If creators use single media bento heavily, they may need reusable assets, collections, custom posters, and richer portfolio-style presentation.

**Context:** Current scope intentionally ships one representative work per media bento. Do not start this expansion until real profile usage shows creators want more than one asset per block or need to reuse uploaded media.

**Effort:** XL
**Priority:** P3
**Depends on:** Usage evidence from shipped single media bento

## Completed

- Hono profile-page API migration pass: `handle-availability`, metadata read/update, links create/update/delete/reorder, and text create/update/delete/reorder now delegate through the profile-page Hono app. `social-links`, `playlist`, `sync`, `upload-image`, and bento upload/sync remain intentionally outside this pass.
