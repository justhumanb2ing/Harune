# TODOS

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
