---
title: API me server contract
date: 2026-05-07
category: best-practices
module: api-architecture
problem_type: best_practice
component: api
severity: medium
applies_when:
  - 서버 레포에서 로그인 이후 `/api/me`를 다시 만들 때
  - user, plan, owned profile summary를 한 번에 내려주는 DTO가 필요할 때
  - public profile page와 authenticated app context의 경계를 나눌 때
tags: [api, me, server, auth, cache, profile]
---

# API me server contract

## Context

`/api/me`는 인증 자체를 담당하는 엔드포인트가 아니다. 서버에서 로그인한 사용자를 기준으로 앱 전역이 공통으로 필요로 하는 상태를 한 번에 내려주는 DTO다.

이 문서의 기준에서 `/api/me`는 다음을 묶는 app bootstrap DTO다.

- `user`
- `currentPlan`
- `profilePage`

public profile page가 page-centric read model이라면, `/api/me`는 app-centric user context다.

## What It Is For

`/api/me`는 아래 같은 경우에 유용하다.

- 서버에서 account badge, sidebar shell, owner header 같은 화면 공통 상태를 만들 때
- credits, plan, subscription tier 같은 계정 상태를 여러 서버 렌더/route가 함께 참조할 때
- 프로필 수정 후 `user`와 `profilePage`를 한 번에 다시 읽어야 할 때
- `auth()` 결과보다 더 풍부한 사용자 컨텍스트가 필요할 때

이 route가 있으면 각 화면이 `auth()` + user read + plan read + owned profile read를 따로 조합하지 않아도 된다.

## What It Is Not For

`/api/me`는 아래 용도가 아니다.

- public profile page 렌더링
- route guard 자체
- 세션 존재 여부만 확인하는 로그인 체크
- 공개 페이지의 owner 판별 전용 API

즉, `getSession`/`auth()`와 `/api/me`를 섞으면 안 된다.  
`getSession`은 "누구인지"를 확인하고, `/api/me`는 "그 사용자의 앱 상태가 무엇인지"를 반환한다.

## Canonical Response Shape

가능하면 아래 shape를 유지한다.

```ts
interface MeResponse {
  currentPlan: {
    id: string;
    name: string;
    codename: string;
    quotas: unknown;
    default: boolean;
  } | null;
  profilePage: {
    id: string;
    handle: string;
    name: string;
    image: string | null;
  } | null;
  user: {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    createdAt: string;
    updatedAt: string;
    planId: string | null;
    credits: Record<string, number>;
    // provider ids and email verification fields may exist, but password must not be exposed
  };
}
```

권장 규칙:

- `currentPlan`은 없을 수 있으므로 `null` 허용
- `profilePage`는 없을 수 있으므로 `null` 허용
- `user`는 항상 포함
- `password`는 절대 포함하지 않음
- 날짜는 JSON 응답에서 문자열로 내려감

## Minimal Implementation

다른 레포에서 가장 작은 구현은 다음 3단계로 나눌 수 있다.

```text
1. authenticated session 확보
2. user row read + owned plan read + owned profile read
3. 하나의 JSON response로 반환
```

권장 구현 경계는 다음과 같다.

```text
route
  -> auth/session check
  -> service
  -> repository reads
```

`route`는 HTTP 상태와 JSON 모양만 담당하고, `service`는 조합 규칙만 담당하고, `repository`는 DB read만 담당한다.

## Cache Contract

이 endpoint는 보통 앱 전역의 단일 cache key 또는 server-side memoization 단위와 같이 사용한다.

```ts
queryKey: ["app", "me"]
```

캐시 정책은 다음이 안전하다.

- request-scoped read가 아니라면 stale snapshot을 재사용하지 않음
- mutation 후에는 `me` cache를 invalidate 또는 revalidate
- 프로필 핸들/이미지 변경 후에는 app shell 전체가 같은 cache key를 다시 읽을 수 있어야 함

같은 사용자를 기준으로 여러 화면이 동시에 `user`, `plan`, `profilePage`를 읽는다면, 이 endpoint를 쪼개는 것보다 하나의 cache key로 묶는 편이 낫다.

## When To Split It

다음 경우에는 `/api/me`를 유지하지 말고 쪼개는 편이 낫다.

- 앱 셸이 없고, user/plan/profilePage를 같이 쓸 일이 없다
- plan과 credits를 다른 화면에서 전혀 공유하지 않는다
- profilePage 데이터가 public page와 editor에서 완전히 다른 lifecycle을 가진다

반대로 아래 조건이면 `/api/me`를 유지하는 쪽이 합리적이다.

- 로그인 후 공통 header/sidebar가 존재한다
- credits 또는 subscription state가 전역적으로 보여진다
- owned profile summary가 여러 화면에서 반복 사용된다

## Public Profile Boundary

public profile page에서는 `/api/me`를 기본적으로 사용하지 않는다.

public route는 page-centric read model을 직접 읽고, authenticated owner 여부가 필요할 때만 `auth()` 또는 별도 owner lookup을 수행한다.  
즉, 공개 페이지에서 필요한 것은 "현재 로그인 사용자의 전체 앱 상태"가 아니라 "이 공개 page가 누구의 것인지"다.

이 경계를 지키지 않으면 public page가 account bootstrap DTO에 과도하게 의존하게 된다.

## Example

서버에서의 최소 사용 형태는 보통 다음과 같다.

```ts
const me = await getMeForUser(userId);
```

사용 예:

- `me.user.name`으로 account menu payload 구성
- `me.currentPlan`으로 plan badge payload 구성
- `me.profilePage.handle`로 owner navigation payload 구성

## Common Mistakes

- `auth()`만 반환하고 앱에서 필요한 profile/plan 상태를 각 route가 따로 추가 조회하는 것
- `/api/me`를 public profile page까지 끌고 가는 것
- mutation 후 `me` cache invalidate를 빼먹는 것
- response에 raw user row를 그대로 실어 `password` 또는 과한 provider id를 노출하는 것
- `currentPlan`과 `profilePage`를 필수 값으로 만들어 신규 사용자 흐름을 깨는 것

## Reuse Checklist

다른 서버 레포에서 이 contract를 옮길 때는 아래만 확인하면 된다.

```text
1. authenticated session source
2. user read
3. owned plan read
4. owned profile summary read
5. password exclusion
6. nullability for new users
7. cache key and invalidate strategy
8. public page does not depend on this route
```

## Related

- `docs/solutions/best-practices/hono-next-api-boundary-2026-05-03.md`
- `docs/solutions/best-practices/better-auth-supabase-rls-boundary-2026-04-28.md`
- `docs/solutions/documentation-gaps/auth-navigation-and-cache-boundaries-2026-04-28.md`
- `docs/solutions/documentation-gaps/profile-page-domain-map-2026-04-28.md`
