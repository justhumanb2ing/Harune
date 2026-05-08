---
title: Handle change external server migration contract
date: 2026-05-08
category: best-practices
module: api-architecture
problem_type: best_practice
component: api
severity: medium
applies_when:
  - 핸들 변경 mutation을 별도 외부 서버로 옮길 때
  - current profile sync에서 handle update를 분리할 때
  - handle 변경 후 client cache와 browser URL을 다시 맞춰야 할 때
tags: [api, handle, migration, server, profile, cache]
---

# Handle change external server migration contract

## Context

현재 핸들 변경은 editor 내부의 profile sync 흐름과 붙어 있다. 실제 UI는 `src/components/profile/editor-block/change-handle-button.tsx`에서 handle을 normalize하고 availability를 확인한 뒤, `POST /api/profile/sync`로 draft sync를 보내고, 성공하면 `queryKeys.app.me()`와 profile page query를 직접 rebasing한 다음 `window.history.replaceState(...)`로 URL만 바꾼다.

이 구조는 동작은 하지만, handle 변경이라는 단일 mutation이 full profile draft persistence에 묶여 있다. 외부 서버로 다시 작성할 때는 handle 변경을 독립된 canonical mutation으로 분리하는 편이 안전하다.

## What This Migration Should Do

- handle 변경 write를 외부 서버의 독립 endpoint로 옮긴다.
- client-side format/availability validation은 preflight로 유지한다.
- 성공 시 client는 query cache와 browser URL만 rebase하고, full page remount는 피한다.
- server는 format, reserved handle, uniqueness, ownership을 다시 검증한다.
- 성공 응답은 transaction-local snapshot이 아니라 committed read를 기준으로 반환한다.

## Canonical API Contract

권장 canonical endpoint:

```http
PATCH /handle
Content-Type: application/json
```

Request body:

```ts
{
  handle: string;
}
```

권장 response body:

```ts
{
  profilePage: {
    id: string;
    handle: string;
    name: string;
    image: string | null;
  };
  previousHandle: string;
}
```

이 response는 client가 다음 세 가지를 한 번에 처리할 수 있게 해준다.

- `profilePage.handle`로 `me` cache rebasing
- `previousHandle`과 `profilePage.handle` 비교로 route/cache invalidation
- `profilePage.id`를 유지한 채 owner summary를 다시 맞추기

`profilePage`는 최소한 위 shape를 유지하고, 필요하면 `userId`나 `updatedAt`을 추가해도 된다. 다만 client가 handle 변경 후에 필요한 핵심 값은 `id`, `handle`, `name`, `image`다.

## Validation Rules

server는 아래 규칙을 반드시 다시 검사한다.

1. authentication required
2. handle trim + lowercase normalization
3. empty handle reject
4. reserved handle reject
5. format reject: letters, numbers, underscore only
6. current user ownership 확인
7. 다른 사용자가 이미 점유한 handle이면 409 reject

권장 error contract:

- `401`: existing unauthorized JSON contract
- `400`: validation failed
- `404`: profile page not found
- `409`: handle already taken
- `500`: unexpected server error

같은 handle을 다시 보내는 경우는 idempotent no-op으로 처리하는 편이 좋다. 즉, 이미 canonical handle이면 200으로 현재 상태를 돌려주고, client는 route만 다시 맞추면 된다.

## Server Responsibilities

외부 서버는 아래 순서를 지켜야 한다.

```text
1. session/auth check
2. payload normalization
3. format/reserved validation
4. current ownership lookup
5. uniqueness lookup
6. canonical handle write
7. committed read response
8. no-store JSON response
```

주의할 점:

- `tx` 내부에서 읽은 값을 성공 응답으로 삼지 않는다.
- handle update를 full profile sync transaction에 끼워 넣지 않는다.
- route handler가 DB mutation과 response shaping을 직접 다 하지 말고, service/repository 경계를 둔다.
- redirect는 server가 아니라 client가 `replaceState`로 처리한다.

## Client Responsibilities

client는 handle 변경 후 아래 순서를 유지한다.

```text
1. local validation / availability check
2. PATCH /handle
3. response 성공 시 cache rebasing
4. window.history.replaceState(...)
5. popover close
```

권장 rebasing 범위:

- `queryKeys.app.me()`
- handle 기반 profile page query key
- availability query key

실패 시에는 현재 URL과 draft를 유지해야 한다. handle mutation 실패가 editor state를 흔들면 안 된다.

## Cutover Plan

1. 외부 서버에 `PATCH /handle`를 먼저 추가한다.
2. current app에서 handle write를 `POST /api/profile/sync`와 분리한다.
3. `src/components/profile/editor-block/change-handle-button.tsx`가 외부 서버를 직접 호출하도록 바꾼다.
4. success response를 기준으로 `me` cache와 profile query를 patch한다.
5. `window.history.replaceState(...)`는 그대로 유지한다.
6. old local write path는 제거한다.

## What Not To Do

- handle 변경을 계속 full profile sync payload에 묶어 두지 않는다.
- success toast를 persistence 근거로 삼지 않는다.
- transaction-local read를 committed read처럼 쓰지 않는다.
- route navigation으로 handle 변경을 처리하지 않는다.
- handle availability와 handle write contract를 서로 다른 validation rule로 두지 않는다.

## Minimal Test Checklist

서버 쪽에서는 아래 케이스를 꼭 닫는다.

```text
1. session 없음 -> 401
2. invalid handle -> 400
3. reserved handle -> 400
4. taken handle -> 409
5. current handle same-value request -> 200 no-op
6. ownership mismatch -> 404 or 409
7. response가 committed read 기준인지 확인
```

client 쪽에서는 아래를 확인한다.

```text
1. success 후 URL만 바뀌는지
2. page remount flicker가 없는지
3. me cache의 profilePage.handle이 바뀌는지
4. old/new handle query가 어긋나지 않는지
5. 실패 시 draft와 URL이 유지되는지
```

## Related Files

- `src/components/profile/editor-block/change-handle-button.tsx`
- `src/lib/profile/app-paths.ts`
- `src/lib/api/routes/app.ts`
- `src/lib/api/services/app.ts`
- `src/lib/api/app/__test__/app-api.test.ts`
- `src/hooks/use-profile-handle-availability.ts`

## Related

- `docs/solutions/best-practices/api-me-app-context-contract-2026-05-07.md`
- `docs/solutions/best-practices/hono-next-api-boundary-2026-05-03.md`
- `docs/solutions/logic-errors/profile-page-draft-sync-persistence-regression-2026-04-27.md`
