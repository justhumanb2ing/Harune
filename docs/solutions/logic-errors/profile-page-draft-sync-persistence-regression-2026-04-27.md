---
title: Profile page draft sync persistence regression
date: 2026-04-27
category: logic-errors
module: profile-page
problem_type: logic_error
component: database
symptoms:
  - Sync payload and response contain changed Profile, Social, Link, or Text values, but refresh restores old values.
  - Success toast can appear even though the committed DB row was not updated.
  - Reordering social links can return the expected positions in the response while the persisted order remains stale.
  - Duplicate sync?t and profile-page?t requests can appear if client-side verification retry logic is added.
root_cause: logic_error
resolution_type: code_fix
severity: high
tags: [profile-page, sync, db-persistence, transaction, ordering, cache]
---

# Profile page draft sync persistence regression

## Problem
Profile page Sync could report success and return the changed editor data even though a later refresh, API read, or direct DB inspection still showed the previous values. The issue affected the full draft sync surface: profile fields, social links, link items, text box items, deletion, and ordering.

The confusing part was that the network payload and network response were both correct. For example, after swapping `mail` and `x`, the payload and response could show `mail.position = 2` and `x.position = 1`, but the committed DB state still had the old order.

## Symptoms
- Pressing Sync showed a success toast.
- `POST /api/app/profile-page/sync` payload contained the edited data.
- `POST /api/app/profile-page/sync` response also contained the edited data.
- Refreshing the editor called the normal profile-page read path and restored the old data.
- Direct DB inspection still showed the old values.
- The first sync after starting the dev server could appear to work, while later syncs did not reliably persist.
- A previous diagnostic attempt introduced duplicate `sync?t=...` and `profile-page?t=...` requests with different timestamps.

## What Didn't Work
- Treating this as only a cache invalidation issue was incomplete. Cache could make stale reads more visible, but it did not explain why a direct DB read still showed old values.
- Trusting the Sync response as proof of persistence was unsafe. The response was not necessarily coming from a committed DB read.
- Retrying Sync or adding verification requests with timestamp query parameters created noise. It produced duplicate `sync?t=...` and `profile-page?t=...` requests, but it did not fix persistence.
- Focusing only on social-link ordering was too narrow. The same response-versus-DB mismatch also applied to profile text fields, item edits, and deletion.

## Root Cause
The Sync mutation built its success response from a transaction-local read:

```ts
return await db.transaction(async (tx) => {
  // write profile page, social links, link items, text boxes

  return await getProfilePageEditorDataByPageId(tx, ownedPage.id);
});
```

That made the response look correct because it was assembled inside the same transaction scope as the attempted writes. In the observed runtime, transaction-returned values could diverge from what later committed reads returned. The same pattern was reproduced in another API flow: `/api/app/create` could return a created profile page from inside a transaction, while immediate `/api/app/me` and `/api/app/profile-page` reads still behaved as if the page did not exist.

So the answer to "How can the response contain changed values when the DB was not updated?" is:

> The response was not evidence of committed persistence. It was generated from a transaction-local view before the app proved that a normal post-write DB read could see the same data.

There were two additional ordering issues that made the social-link case harder to reason about:

1. Sync helpers used loop indexes as the persisted order in some places instead of the explicit `position` values in the payload.
2. Draft creation and rendering paths did not consistently sort server data by persisted `position`, so array order and `position` could disagree.

## Solution
Make the Sync response come from the same read path that refresh uses: a normal DB read after the writes finish.

The fixed `syncProfilePageDraft` flow writes the page and child collections, then reads the profile-page editor data outside the previous transaction-local response path:

```ts
await syncSocialLinks({
  pageId: ownedPage.id,
  socialLinks: values.socialLinks,
  executor: db,
});

await syncLinkItems({
  pageId: ownedPage.id,
  linkItems: values.linkItems,
  executor: db,
});

await syncTextBoxItems({
  pageId: ownedPage.id,
  textBoxItems: values.textBoxItems,
  executor: db,
});

const nextData = await getProfilePageEditorDataByPageId(db, ownedPage.id);

if (!nextData) {
  throw new ProfilePageError("Profile page was not found after sync.", 404);
}

return nextData;
```

This changes the meaning of a successful Sync response. It now means the server performed the writes and a subsequent normal DB read observed the saved state.

The ordered collection helpers were also changed to persist the explicit payload positions. This matters when the client sends an array whose order differs from the `position` fields:

```ts
await executor
  .update(profileSocialLinks)
  .set({
    href: socialLink.href,
    isVisible: socialLink.isVisible,
    label: socialLink.label,
    platform: socialLink.platform,
    position: socialLink.position,
    updatedAt: now,
  })
  .where(and(eq(profileSocialLinks.id, existing.id), eq(profileSocialLinks.profilePageId, pageId)));
```

The same rule applies to link items and text box items:

```ts
position: linkItem.position
```

```ts
position: textBoxItem.position
```

Then the editor draft and rendering paths were hardened so persisted `position` remains the source of truth:

- `src/components/section/profile-page/profile-page-editor-store.ts`
  - `createDraftData` sorts `socialLinks`, `linkItems`, and `textBoxItems` by `position` before rebuilding draft arrays.
- `src/components/section/profile-page/profile-page-renderer.tsx`
  - renderer sorts visible social links, link items, and text boxes by `position`.
- `src/components/section/profile-page/public-profile-page.tsx`
  - public page rendering uses the same defensive ordering.

The previous verification retry path was removed from `use-profile-page-editor.ts`. Sync now sends one request:

```ts
const response = await apiFetch<ProfilePageData>("/api/app/profile-page/sync", {
  method: "POST",
  cache: "no-store",
  headers: {
    "Cache-Control": "no-store",
    "Content-Type": "application/json",
  },
  body: JSON.stringify(nextDraftData),
});
```

The API routes were also marked as dynamic/no-store so the editor does not reuse stale profile data:

```ts
export const dynamic = "force-dynamic";

const noStoreHeaders = {
  "Cache-Control": "no-store",
};
```

## Why This Works
The fix removes the misleading success signal.

Before the fix, Sync could return data read through `tx`, which only proved that the transaction-local view had the attempted changes. It did not prove that a later request, refresh, or DB inspection would observe the same state.

After the fix, Sync returns data read through `db` after the writes. That is the same category of read used by `GET /api/app/profile-page`, so a successful response and a refresh now agree.

Persisting explicit payload positions also makes reorder operations deterministic. If `mail` is sent with `position: 2` and `x` is sent with `position: 1`, the DB writes those values regardless of array order. Sorting by position on draft creation and render then makes the UI match the persisted source of truth.

Removing timestamp-based verification retries also explains the duplicate request symptom:

- `sync?t=...` was not a browser or Next.js automatic duplicate.
- It came from client logic that appended a timestamp to force a fresh verification/retry request.
- `profile-page?t=...` came from the same diagnostic verification pattern.
- The final flow does not need those requests because the Sync response itself is now a committed-read result.

## Prevention
- Do not treat a mutation response as proof of persistence if it is assembled from inside the same transaction that performed the writes.
- For persistence-sensitive mutations, return either:
  - the direct result of the committed write when the database guarantees it, or
  - a normal post-write read through the same query path refresh uses.
- For ordered collections, persist the explicit `position` field from the validated payload. Do not silently replace it with array index unless the API contract says array order is the only source of truth.
- Normalize ordered collections at all boundaries:
  - write path: persist `item.position`
  - read path: query or sort by `position`
  - draft creation: sort by `position`
  - rendering: sort by `position`
- Avoid hidden retry or verification requests that show a success toast after a mismatch. If verification fails, surface the failure and keep the request count understandable.
- When debugging "response is correct but refresh is old," immediately compare:
  - Sync payload
  - Sync response
  - `GET /api/app/profile-page` response after Sync
  - direct DB state
  - whether the Sync response was built from `tx` or from a normal `db` read

Useful regression check for ordering:

```ts
const data = createDraftData({
  socialLinks: [
    { id: "mail", platform: "mail", position: 2 },
    { id: "x", platform: "x", position: 1 },
  ],
  linkItems: [],
  textBoxItems: [],
  // page fields omitted
});

expect(data.socialLinks.map((item) => item.platform)).toEqual(["x", "mail"]);
```

Useful manual API verification:

1. Send `POST /api/app/profile-page/sync` with a changed profile field and reordered social links.
2. Confirm the Sync response shows the changed value and expected positions.
3. Immediately call `GET /api/app/profile-page`.
4. Confirm the GET response matches the Sync response.
5. Refresh the editor.
6. Confirm the UI still shows the changed values.
7. Inspect DB rows if needed:
   - `profile_pages` for profile fields
   - `profile_social_links.position` for social order
   - `profile_link_items.position` for link order
   - `profile_text_box_items.position` and `blockPosition` for text boxes

Verification from the fix:

- `bun x biome check src/lib/profile-page/mutations.ts src/components/section/profile-page/use-profile-page-editor.ts src/components/section/profile-page/profile-page-editor-store.ts src/components/section/profile-page/profile-page-editor-store.test.ts src/components/section/profile-page/profile-page-renderer.tsx src/components/section/profile-page/public-profile-page.tsx src/app/api/app/profile-page/sync/route.ts src/app/api/app/profile-page/route.ts src/components/section/profile-page/change-handle-button.tsx`
- `bun test src/components/section/profile-page/profile-page-editor-store.test.ts src/lib/profile-page/profile-page-sync-schema.test.ts src/lib/profile-page/profile-page-cache-regression.test.ts`
- `bun x tsc --noEmit`
- Local API verification confirmed that Sync response and immediate `GET /api/app/profile-page` both returned the changed profile values and social order.

## Related Issues
- Related solution doc:
  - `docs/solutions/logic-errors/profile-page-image-url-persistence-regression-2026-04-25.md`
- Related planning doc:
  - `docs/plans/2026-04-22-001-feat-profile-page-draft-sync-plan.md`

Relevant code paths:

- `src/lib/profile-page/mutations.ts`
- `src/components/section/profile-page/use-profile-page-editor.ts`
- `src/components/section/profile-page/profile-page-editor-store.ts`
- `src/components/section/profile-page/profile-page-renderer.tsx`
- `src/components/section/profile-page/public-profile-page.tsx`
- `src/app/api/app/profile-page/sync/route.ts`
- `src/app/api/app/profile-page/route.ts`
- `src/components/section/profile-page/change-handle-button.tsx`
