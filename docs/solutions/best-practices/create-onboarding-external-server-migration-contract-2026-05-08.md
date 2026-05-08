---
title: First-signup onboarding page creation external server migration contract
date: 2026-05-08
category: best-practices
module: api-architecture
problem_type: best_practice
component: api
severity: medium
applies_when:
  - `/api/create`를 별도 외부 서버로 옮길 때
  - 신규 사용자 온보딩 생성과 profile page write를 분리할 때
  - create 응답을 committed read 기준으로 고정해야 할 때
tags: [api, create, onboarding, migration, server, profile, cache]
---

# First-signup onboarding page creation external server migration contract

## Context

`/api/create`는 첫 회원가입 직후 온보딩에서 신규 사용자의 첫 public profile page를 만드는 mutation이다.
현재 앱에서는 인증된 세션을 요구하고, 입력을 검증한 뒤, user row와 `profile_pages` row를 함께 갱신한다.
이 엔드포인트는 first page creation을 담당하는 canonical write path다.

이 mutation은 단순한 form submit이 아니라 다음 상태를 한 번에 묶는다.

- authenticated user 존재 여부
- handle 유효성 및 중복 여부
- profile name 필수 여부
- optional profile fields
- committed DB snapshot 기반 성공 응답

외부 서버로 옮길 때는 이 first-signup onboarding contract를 그대로 유지해야 한다.

## Canonical API Contract

권장 canonical endpoint:

```http
POST /profiles
Content-Type: application/json
```

Legacy compatibility target:

```http
POST /api/create
```

Request body shape:

```ts
{
  handle: string;
  name: string;
  bio?: string;
  role?: string;
  location?: string;
  image?: string;
}
```

Success response shape:

```ts
{
  page: {
    id: string;
    handle: string;
    name: string;
  };
  success: true;
}
```

The external server should keep `page.handle`, `page.id`, and `page.name` as the stable public fields.
If additional fields are added later, they must not break the current subset.

## Current Persisted Fields

현재 앱의 `createProfilePage`는 다음 값만 실제로 저장한다.

- `handle`
- `name`
- `bio`
- `role`
- `location`
- `image`

## Validation Rules

외부 서버는 아래 검증을 다시 수행해야 한다.

1. authentication required
2. handle normalize
3. reserved handle reject
4. invalid handle format reject
5. name required
6. bio length validation
7. role/location length validation
8. image URL validation
9. handle uniqueness check

현재 앱 기준으로 handle과 name의 주요 실패 메시지는 다음 의미를 유지해야 한다.

- `400`: invalid handle or missing name
- `404`: user not found
- `409`: handle already taken
- `500`: unexpected server error

## Server Responsibilities

외부 서버는 create mutation을 다음 순서로 처리하는 편이 안전하다.

```text
1. session/auth check
2. payload validation
3. user existence check
4. handle uniqueness check
5. user row update
6. profile page insert
7. committed read response
8. no-store JSON response
```

중요한 점은 성공 응답을 transaction-local snapshot으로 만들지 않는 것이다.
`db.transaction(async (tx) => ...)` 내부에서 읽은 값은 성공의 증거가 아니다.
create 응답은 반드시 커밋 이후의 normal read path를 통해 확인된 상태여야 한다.
`returning()` 결과만으로 성공을 판정하지 말고, commit 이후 read path를 통해 page identity와 name persist를 다시 확인해야 한다.

## What This Migration Should Preserve

- 이미 업로드된 `image`
- user row의 name/image 동기화
- profile page의 first-write semantics
- success response가 committed read 상태를 가리키는 것

## What Not To Do

- create 성공 응답을 transaction 내부 `returning()` 결과로 끝내지 않는다
- user update와 profile page insert를 서로 다른 공통 경로로 분산시키지 않는다
- 예약 handle과 중복 handle을 서로 다른 contract로 취급하지 않는다
- handle uniqueness 실패를 400과 409 사이에서 흔들지 않는다
- commit 전 read를 committed read처럼 문서화하지 않는다

## Migration Checklist

외부 서버로 옮길 때는 아래 항목을 함께 닫아야 한다.

```text
1. canonical endpoint를 /profiles로 고정
2. /api/create compatibility layer 여부 결정
3. auth/session source 연결
4. onboarding schema parity
5. handle uniqueness lookup
6. user row update + profile page insert
7. committed-read response
8. no-store cache policy
```

## Minimal Test Checklist

서버 쪽에서는 최소 아래 케이스를 확인해야 한다.

```text
1. session 없음 -> 401
2. invalid handle -> 400
3. reserved handle -> 400
4. missing name -> 400
5. taken handle -> 409
6. user not found -> 404
7. success response contains committed read page data
8. immediate follow-up read sees the same created page
```

## Related Files

- `src/lib/api/routes/app.ts`
- `src/lib/api/services/app.ts`
- `src/lib/api/repositories/app.ts`
- `src/lib/validations/auth.schema.ts`
- `src/lib/api/app/__test__/app-api.test.ts`

## Related

- `docs/solutions/best-practices/hono-next-api-boundary-2026-05-03.md`
- `docs/solutions/best-practices/handle-change-external-server-migration-2026-05-08.md`
- `docs/solutions/logic-errors/profile-page-draft-sync-persistence-regression-2026-04-27.md`
- `docs/solutions/documentation-gaps/user-onboarding-and-auth-funnel-map-2026-04-28.md`
