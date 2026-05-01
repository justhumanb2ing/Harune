---
title: Profile page image upload URL persistence regression
date: 2026-04-25
category: logic-errors
module: profile-page
problem_type: logic_error
component: database
symptoms:
  - Profile or background image files are saved to storage but profile_page image columns are not reliably updated.
  - Sync can report success, but refresh shows the previous image again.
  - Repeated uploads create more than the expected profile and background image objects for one user.
root_cause: missing_workflow_step
resolution_type: code_fix
severity: high
tags: [profile-page, image-upload, s3, db-persistence, cache-invalidation, sync]
---

# Profile page image upload URL persistence regression

## Problem
Profile page image uploads were able to write files to storage without reliably persisting the resulting URL to `profile_page.image` or `profile_page.backgroundImage`. The most visible failure was background images appearing in storage while the DB column stayed `null` or kept the previous URL, so refresh restored the old image.

The upload flow also used UUID object keys, so every replacement created another storage object. A user could accumulate many profile-page image objects even though the product only has two image slots: profile and background.

## Symptoms
- Selecting a profile or background image created an object in S3-compatible storage.
- Pressing Sync could still show a success state.
- Refreshing the editor or public page could show the previous image.
- `profile_page.backgroundImage` or `profile_page.image` could remain unset or stale after upload.
- Re-uploading the same image created another storage object instead of becoming a no-op.

## What Didn't Work
- Treating cache invalidation as the complete fix was insufficient. Stale React/Next/React Query reads can make the problem look worse, but they do not guarantee DB persistence after a storage upload.
- Relying on the later `/api/app/profile-page/sync` request as the only DB write left a gap: storage upload could succeed before the sync request failed, validated a stale draft, or never persisted the image column.
- Comparing full public URLs for cleanup was unsafe after introducing cache-busting query strings. The same storage object with a different `?v=` value is not a different object and must not be deleted.
- UUID object keys were the wrong model for fixed user image slots. They made orphan cleanup hard and allowed unbounded growth.

## Solution
Make image upload persistence explicit and slot-based.

First, use stable storage keys for the two image slots:

```ts
export function getProfileImageObjectKey(userId: string, kind: ProfileImageKind) {
  return `public/users/${userId}/profile-page/${kind}`;
}
```

Valid `kind` values are `profile` and `background`, so each user has at most two active profile-page image objects:

```text
public/users/{userId}/profile-page/profile
public/users/{userId}/profile-page/background
```

Second, compute a SHA-256 hash before upload and store it as a cache version in the public URL. If the selected file already matches the stored `?v=` hash, skip the storage write entirely:

```ts
export async function uploadProfileImageIfChanged({ currentUrl, file, kind }) {
  const imageHash = await getFileSha256Hex(file);

  if (getProfileImageCacheVersion(currentUrl) === imageHash) {
    return currentUrl;
  }

  const uploadedUrl = await uploader.uploadFile(file, {
    meta: {
      imageHash,
      imageKind: kind,
    },
  });

  const finalized = await apiFetch<{ imageUrl: string | null }>(PROFILE_IMAGE_UPLOAD_ROUTE, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageKind: kind, imageUrl: uploadedUrl }),
  });

  return finalized.imageUrl ?? uploadedUrl;
}
```

Third, make `POST /api/app/profile-page/upload-image` create a presigned upload for the stable key, not a UUID key. It must require both `imageKind` and `imageHash`:

```ts
const profileImageKind = getProfileImageKind(imageKind);

if (!profileImageKind) {
  return NextResponse.json({ error: "Invalid profile image kind." }, { status: 400 });
}

if (!imageHash || !/^[a-f0-9]{64}$/i.test(imageHash)) {
  return NextResponse.json({ error: "Invalid profile image hash." }, { status: 400 });
}

const s3Path = getProfileImageObjectKey(session.user.id, profileImageKind);
const publicUrl = withProfileImageCacheVersion(getPublicS3ObjectUrl(s3Path), imageHash);
```

Fourth, finalize immediately after storage upload. `PATCH /api/app/profile-page/upload-image` verifies that the submitted URL belongs to the authenticated user's expected slot, then writes the matching DB column:

```ts
const objectKey = getS3ObjectKeyFromPublicUrl(imageUrl);
const expectedKey = getProfileImageObjectKey(context.session.user.id, profileImageKind);

if (objectKey !== expectedKey) {
  return NextResponse.json({ error: "Invalid profile image URL." }, { status: 400 });
}

const updateValues =
  profileImageKind === "background" ? { backgroundImage: imageUrl } : { image: imageUrl };

await db
  .update(profilePages)
  .set({ ...updateValues, updatedAt: new Date() })
  .where(eq(profilePages.userId, context.session.user.id));
```

Keep `/api/app/profile-page/sync` as the full draft synchronization path. It still writes `values.page.image` and `values.page.backgroundImage`, but it is no longer the only place that can persist an uploaded image URL.

Finally, compare storage object keys before deleting replaced images:

```ts
const shouldDeleteReplacedProfileImage = (previousUrl: string | null, nextUrl: string | null) => {
  if (!previousUrl || previousUrl === nextUrl) {
    return false;
  }

  const previousKey = getS3ObjectKeyFromPublicUrl(previousUrl);
  const nextKey = nextUrl ? getS3ObjectKeyFromPublicUrl(nextUrl) : null;

  return !previousKey || previousKey !== nextKey;
};
```

This prevents deleting the same object just because its public URL has a new `?v=` value.

Cache-related hardening should accompany the persistence fix:

- use `cache: "no-store"` for client profile-page and me queries
- mark profile-page/me API routes and profile pages with `dynamic = "force-dynamic"`
- avoid React `cache()` around public profile DB reads
- revalidate the public profile path after sync

## Why This Works
The core invariant becomes explicit: a profile-page image slot maps to one storage object and one DB column.

Stable object keys prevent accumulation. Replacing a profile image overwrites `profile`; replacing a background image overwrites `background`. The `?v={sha256}` URL version gives browsers and CDNs a new URL for changed content without creating a new object.

The finalize step closes the storage/DB gap. Once storage upload succeeds, the app immediately records the resulting URL into `profile_page.image` or `profile_page.backgroundImage`. The later Sync operation can still persist the full editor draft, but image persistence no longer depends on that broader workflow completing successfully.

Hash comparison prevents redundant writes. If the same file is selected again, the client returns the current URL and never asks S3 for another upload.

Object-key-based deletion matches the storage model. Query-string changes are cache versions, not distinct objects.

## Prevention
- For fixed user asset slots, prefer stable object keys plus URL versioning over UUID object keys.
- Treat storage upload and DB persistence as separate workflow steps. Storage success alone is not user-visible persistence.
- Add tests that prove changed uploads call a DB finalize endpoint and same-file uploads do not call storage.
- When public URLs include cache-busting query strings, cleanup logic must compare parsed storage object keys, not full URL strings.
- Keep profile image columns in `profile_page` as the source of truth for public profile rendering.

Useful regression checks:

```ts
expect(getProfileImageObjectKey("user-1", "profile")).toBe(
  "public/users/user-1/profile-page/profile"
);

expect(getProfileImageObjectKey("user-1", "background")).toBe(
  "public/users/user-1/profile-page/background"
);
```

```ts
expect(uploadedUrl).toBe(currentUrl);
expect(fetchCount).toBe(0);
```

```ts
expect(fetchCalls[2]?.input).toBe("/api/app/profile-page/upload-image");
expect(fetchCalls[2]?.init?.method).toBe("PATCH");
expect(finalizeBody.imageKind).toBe("background");
expect(finalizeBody.imageUrl.includes("/profile-page/background?v=")).toBe(true);
```

Verification from the fix:

- `bun test`: 40 tests passed
- targeted `biome check` for changed files: passed
- `bun x tsc --noEmit`: only the pre-existing `src/components/sections/sidebar.tsx:415` `asChild` type error remained

## Related Issues
- Related solution docs: none existed when this was documented.
- Related planning docs that may now be stale:
  - `docs/plans/2026-04-21-001-feat-profile-page-editor-plan.md` mentions deferred orphan cleanup; the stable-key upload model supersedes that concern for new uploads.
  - `docs/plans/2026-04-22-001-feat-profile-page-draft-sync-plan.md` describes image upload/delete as Sync-time work; current behavior finalizes image columns immediately after upload.
