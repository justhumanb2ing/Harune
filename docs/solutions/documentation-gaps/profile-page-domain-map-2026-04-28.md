---
title: Profile page domain context map
date: 2026-04-28
category: documentation-gaps
module: profile-page
problem_type: documentation_gap
component: documentation
severity: high
applies_when:
  - 프로필 페이지 편집기, 공개 페이지, 이미지 업로드, 동기화 로직을 수정할 때
  - profile_page 관련 회귀를 디버깅할 때
  - draft state와 persisted DB state의 경계를 확인할 때
tags: [profile-page, draft-sync, public-profile, editor, persistence]
---

# Profile page domain context map

## Context
Profile page는 Harune의 핵심 제품 도메인이다. 사용자는 로컬 draft를 편집하고 `Sync`로 DB에 반영하며, 공개 핸들 페이지는 persisted data만 렌더링한다. 이 경계가 흐려지면 “응답은 성공인데 새로고침하면 사라지는” 종류의 회귀가 생긴다.

## Guidance
Profile page의 truth source는 DB의 `profile_page` 계열 테이블이다.

| Entity | Schema | Runtime type |
|---|---|---|
| Page metadata | `profilePages` | `ProfilePage`, `DraftProfilePage` |
| Social links | `profileSocialLinks` | `SocialLink`, `DraftSocialLink` |
| Link items | `profileLinkItems` | `LinkItem`, `DraftLinkItem` |
| Text boxes | `profileTextBoxItems` | `TextBoxItem`, `DraftTextBoxItem` |
| Bento v2 items | `profileBentos`, `profileBentoLayouts`, `profileLinkBentos`, `profileTextBentos`, `profilePlaylistBentos`, `profileSectionBentos` | `ProfileBentoItem`, `PublicProfileBentoPageData` |

읽기 경로는 두 개로 나뉜다.

```text
Editor read:
GET /api/app/profile-page
  -> withAuthRequired
  -> getProfilePageEditorData(userId)
  -> profilePageQueryOptions()
  -> editor provider/store

Public read:
/:handle
  -> getPublicProfilePage(handle)
  -> PublicProfilePage

Bento v2 read:
/v2/:handle
  -> getPublicProfileBentoPage(handle)
  -> getPublicProfileBentoPageByPageId(db, page.id)
  -> ProfileBentoPage
```

쓰기 경로는 draft 전체 동기화를 중심으로 본다.

```text
Editor draft
  -> buildSyncPayload(draftData)
  -> POST /api/app/profile-page/sync
  -> profilePageSyncSchema
  -> syncProfilePageDraft(userId, values)
  -> normal DB read after writes
  -> query invalidation and store rebase

Bento v2 editor
  -> ProfileBentoInteractiveGrid current payload
  -> POST /api/app/profile-page/bento/sync
  -> profileBentoSyncSchema
  -> syncProfileBentoDraft(userId, values)
  -> normal DB read with getPublicProfileBentoPageByPageId(db, ownedPage.id)
  -> local editor rebase from committed response
```

Profile-page sync responses must never be assembled from draft state or a transaction-local read. If a route rebase client/editor state, the response must be a committed DB snapshot read through `db` after writes complete. See `docs/solutions/logic-errors/profile-page-draft-sync-persistence-regression-2026-04-27.md`.

이미지 업로드는 저장소 업로드와 DB column finalize가 둘 다 끝나야 persisted 상태로 본다.

```text
select local file
  -> SHA-256 hash
  -> skip upload if current ?v=hash matches
  -> stable object key public/users/{userId}/profile-page/{profile|background}
  -> PATCH /api/app/profile-page/upload-image
  -> update profile_page.image or profile_page.backgroundImage
```

위치 정렬 규칙은 다음과 같다.

- 각 collection의 `position`은 dense order로 유지한다.
- 링크 블록과 텍스트 박스 블록의 상호 배치는 `profile_page.linkBlockPosition`과 `profile_text_box_item.blockPosition`으로 결정한다.
- unique position index가 있는 테이블은 재정렬 전에 임시 음수 position으로 비워 충돌을 피한다.
- 서버 응답과 렌더러는 항상 persisted `position` 기준으로 정렬한다.

## Why This Matters
Profile page는 draft, React Query cache, browser fetch cache, DB state, public page cache가 동시에 얽힌다. 캐시를 고쳐도 DB write가 실패하면 문제가 남고, DB write가 맞아도 editor store rebase가 틀리면 사용자는 실패로 본다. 문제를 좁힐 때는 “현재 보고 있는 값이 draft인지, 캐시인지, 정상 DB 재조회인지”를 먼저 분리한다.

## When to Apply
- `src/components/section/profile-page/profile-page-editor-store.ts`를 바꿀 때
- `src/lib/profile-page/mutations.ts`의 sync 또는 reorder helper를 바꿀 때
- `/api/app/profile-page/bento/sync`, `profile_bento`, `profile_bento_layout`, `profile_*_bento`를 바꿀 때
- 이미지 업로드, S3 cleanup, cache-busting URL을 바꿀 때
- 공개 페이지와 editor preview가 다르게 보이는 문제를 디버깅할 때

## Examples
Sync 성공 조건은 네트워크 응답만으로 판단하지 않는다. 안전한 확인 흐름은 아래와 같다.

```text
1. POST /api/app/profile-page/sync payload 확인
2. route response 확인
3. GET /api/app/profile-page 정상 read 확인
4. 직접 DB row 확인
5. editor store가 response로 rebase되는지 확인
6. 공개 페이지 revalidate 대상 확인
```

Bento v2 저장 문제는 `profile_bento` parent row만 보지 말고 type-specific child table도 같이 확인한다.

```text
1. POST /api/app/profile-page/bento/sync payload 확인
2. route response 확인
3. getPublicProfileBentoPage(handle) 정상 read 확인
4. 직접 DB에서 profile_bento, profile_bento_layout, profile_link_bento, profile_text_bento, profile_playlist_bento, profile_section_bento 확인
5. response가 getPublicProfileBentoPageByPageId(db, ownedPage.id) 결과인지 확인
6. transaction-local read 또는 optimistic payload로 response를 만들지 않았는지 확인
```

이미지 URL 비교는 전체 URL 문자열보다 object key를 기준으로 한다. 같은 object라도 `?v=` 값이 바뀔 수 있기 때문이다.

## Related
- `docs/solutions/logic-errors/profile-page-draft-sync-persistence-regression-2026-04-27.md`
- `docs/solutions/logic-errors/profile-page-image-url-persistence-regression-2026-04-25.md`
- `docs/plans/2026-04-21-001-feat-profile-page-editor-plan.md`
- `docs/plans/2026-04-22-001-feat-profile-page-draft-sync-plan.md`
