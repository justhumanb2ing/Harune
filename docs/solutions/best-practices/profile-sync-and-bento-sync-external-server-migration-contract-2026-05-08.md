---
title: Profile sync and bento sync external server migration contract
date: 2026-05-08
category: best-practices
module: api-architecture
problem_type: best_practice
component: api
severity: medium
applies_when:
  - `POST /api/profile/sync`와 `POST /api/profile/bento/sync`를 외부 서버로 분리할 때
  - profile draft 저장과 bento draft 저장을 같은 committed-read 원칙으로 유지해야 할 때
  - legacy `POST /api/profile/*` 계약을 외부 canonical route로 옮기면서 응답 shape를 보존해야 할 때
tags: [api, profile-page, bento, sync, migration, server, committed-read]
---

# Profile sync and bento sync external server migration contract

## Context

`/api/profile/sync`와 `/api/profile/bento/sync`는 단순한 form submit이 아니다.
둘 다 저장 후 바로 읽히는 committed-read mutation이고, 저장 실패보다 더 위험한 것은 "응답은 성공인데 커밋된 상태는 옛 값"인 회귀다.

이 문서는 외부 서버 분리 시 서버가 반드시 유지해야 할 계약만 적는다.
클라이언트의 store rebase, toast, optimistic update, retry 로직은 범위 밖이다.

현재 앱 기준 legacy public route는 다음이다.

```text
POST /api/profile/sync
POST /api/profile/bento/sync
```

외부 서버의 canonical mutation route는 다음처럼 분리하는 편이 맞다.

```text
PUT /profiles/me/draft
PUT /profiles/me/bento
```

legacy route는 호환성 계층으로 남겨두고, 실제 persistence contract는 외부 canonical route에서 구현한다.

## Legacy Compatibility Mapping

외부 서버로 이동하더라도 public contract는 당분간 유지하는 편이 안전하다.

```text
POST /api/profile/sync      -> PUT /profiles/me/draft
POST /api/profile/bento/sync -> PUT /profiles/me/bento
```

이 매핑은 URL만 바꾸는 것이 아니다.
request validation, ownership check, committed-read response, no-store header까지 함께 옮겨야 한다.

## What This Migration Must Preserve

- 인증된 사용자만 저장할 수 있어야 한다.
- payload validation은 서버가 다시 수행해야 한다.
- ownership check는 서버가 다시 수행해야 한다.
- 성공 응답은 transaction-local snapshot이 아니라 committed DB snapshot이어야 한다.
- JSON response는 no-store여야 한다.
- profile draft 저장과 bento draft 저장은 서로 다른 write model로 유지해야 한다.
- public/profile editor가 같은 데이터에 대해 다시 읽었을 때 같은 persisted state를 보아야 한다.

## Canonical Route Contract

### `PUT /profiles/me/draft`

역할:

- profile page draft를 저장한다.
- page metadata를 갱신한다.
- handle uniqueness를 다시 검사한다.
- 성공 응답은 normal read path의 committed snapshot이어야 한다.

Request body:

```ts
{
  page: {
    handle: string;
    location: string;
    name: string;
    role: string;
    bio: string;
    image: string | null;
    backgroundImage: string | null;
  };
}
```

Validation rules:

1. session required
2. handle format validation
3. handle uniqueness validation
4. name required
5. location, role, bio length validation
6. image URL validation
7. backgroundImage URL validation

Success response:

```ts
{
  page: {
    id: string;
    handle: string;
    location: string | null;
    name: string | null;
    role: string | null;
    bio: string | null;
    image: string | null;
    backgroundImage: string | null;
  };
}
```

응답의 핵심은 `page`가 아니라 `page`가 가리키는 persisted row다.
즉, `PATCH`/`PUT` 성공 응답은 payload echo가 아니라 committed read 결과여야 한다.

### `PUT /profiles/me/bento`

역할:

- profile bento v2 draft를 저장한다.
- bento parent row와 type-specific child row를 함께 갱신한다.
- layout과 content를 함께 저장한다.
- media bento가 있으면 temporary object를 final object로 승격한다.
- 성공 응답은 public bento read model의 committed snapshot이어야 한다.

Request body:

```ts
{
  bento: Array<{
    id: string;
    type: "link" | "text" | "playlist" | "section" | "media" | "map";
    layout: {
      desktop: { x: number; y: number; w: number; h: number };
      compact: { x: number; y: number; w: number; h: number };
    };
    content: unknown;
  }>;
}
```

Type-specific content rules:

- `link`
  - `title`
  - `description?`
  - `favicon?`
  - `thumbnail?`
  - `url`
- `text`
  - `content`
- `playlist`
  - `title`
  - `provider`
  - `url`
  - `content`
- `section`
  - `title`
- `media`
  - `mediaType`
  - `url`
  - `objectKey`
  - `tempObjectKey?`
  - `contentHash?`
  - `contentType?`
  - `href?`
  - `alt`
  - `caption`
- `map`
  - `latitude`
  - `longitude`
  - `zoom`
  - `caption`
  - `url`

Validation rules:

1. session required
2. duplicate bento ids reject
3. layout must fit grid bounds
4. width/height must satisfy per-type constraints
5. media ownership must match current user
6. temporary media key must belong to the same bento id
7. media hash and content type must be present when temp upload is finalized
8. map URL must be a valid Google Maps URL

Success response:

```ts
{
  page: {
    id: string;
    handle: string;
    updatedAt: string;
    location: string | null;
    name: string | null;
    role: string | null;
    bio: string | null;
    image: string | null;
    backgroundImage: string | null;
    userName: string | null;
  };
  bento: Array<{
    id: string;
    type: "link" | "text" | "playlist" | "section" | "media" | "map";
    layout: {
      desktop: { x: number; y: number; w: number; h: number };
      compact: { x: number; y: number; w: number; h: number };
    };
    content: unknown;
  }>;
}
```

`bento`는 저장 payload의 echo가 아니라 public read model의 결과여야 한다.
특히 media item은 temp upload가 final object로 승격된 뒤의 objectKey와 URL을 기준으로 반환해야 한다.

## Server Responsibilities

### Profile draft sync

권장 처리 순서:

```text
1. auth/session check
2. body validation
3. owned page lookup
4. handle uniqueness lookup
5. profile row update
6. normal DB read after commit
7. no-store JSON response
```

중요한 점:

- `db.transaction(async (tx) => ...)` 내부 반환값을 성공 응답으로 쓰지 않는다.
- `returning()` 결과만으로 저장 성공을 증명하지 않는다.
- handle 변경이 있으면 다른 사용자의 점유 여부를 다시 확인한다.
- optional field는 server normalization 규칙을 통일한다.

### Bento draft sync

권장 처리 순서:

```text
1. auth/session check
2. body validation
3. owned page lookup
4. deleted bento cleanup
5. parent bento row write
6. layout row write
7. type-specific child row write
8. normal public-read path after commit
9. orphan temp media cleanup
10. no-store JSON response
```

중요한 점:

- parent row와 child row를 분리해서 쓰되, 응답은 하나의 committed snapshot으로 묶는다.
- media bento는 temp object와 final object를 구분한다.
- temp object cleanup은 성공 응답의 근거가 아니다.
- public read model과 editor read model이 같은 persisted data를 바라보는지 항상 확인한다.

## What Not To Do

- transaction-local read를 committed-read처럼 반환하지 않는다.
- payload echo를 성공 응답으로 쓰지 않는다.
- profile sync와 bento sync를 한 route에 다시 합치지 않는다.
- client-side retry를 server contract의 일부처럼 다루지 않는다.
- store rebase나 cache invalidation을 mutation 성공의 증거로 보지 않는다.
- legacy route를 external canonical route 없이 다시 로컬 구현으로 복제하지 않는다.
- bento sync에서 type-specific child table을 빠뜨린 채 parent row만 저장하지 않는다.
- media finalize에서 temp object ownership 검증을 생략하지 않는다.

## Migration Checklist

외부 서버 분리 시 같이 닫아야 하는 항목은 다음이다.

```text
1. legacy route -> canonical route mapping
2. auth/session source 연결
3. profile sync schema parity
4. bento sync schema parity
5. handle uniqueness enforcement
6. owned page lookup
7. bento parent/child table write path
8. committed-read response path
9. no-store response headers
10. mutation error mapping
11. temp media ownership/finalize contract
12. regression test coverage
```

## Minimal Test Checklist

서버 쪽에서는 최소 아래를 확인해야 한다.

```text
1. session 없음 -> 401
2. invalid profile payload -> 400
3. taken handle -> 409
4. success response is committed read, not payload echo
5. profile sync 후 immediate read가 같은 page를 반환
6. invalid bento ids -> 400
7. invalid layout -> 400
8. media temp key ownership mismatch -> 400
9. bento sync 후 immediate public read가 같은 bento graph를 반환
10. response headers include no-store
```

## Related Files

- `src/lib/profile/mutations.ts`
- `src/lib/profile/queries.ts`
- `src/lib/validations/profile-content.schema.ts`
- `src/lib/api/services/profile.ts`
- `src/lib/api/services/profile-server.ts`
- `src/lib/api/routes/profile.ts`
- `src/lib/profile/__test__/profile-cache-regression.test.ts`

## Related

- `docs/solutions/logic-errors/profile-page-draft-sync-persistence-regression-2026-04-27.md`
- `docs/solutions/best-practices/hono-next-api-boundary-2026-05-03.md`
- `docs/solutions/best-practices/profile-image-and-bento-media-external-api-migration-contract-2026-05-08.md`
- `docs/solutions/best-practices/create-onboarding-external-server-migration-contract-2026-05-08.md`
