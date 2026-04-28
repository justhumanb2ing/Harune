---
title: Join CTA auth shortcut latency
date: 2026-04-28
category: logic-errors
module: onboarding-auth
problem_type: performance_regression
component: authentication
severity: medium
applies_when:
  - 랜딩 CTA의 `/join` 또는 `/login` shortcut route를 수정할 때
  - CTA 클릭 후 목적지 화면 표시가 느린 문제를 디버깅할 때
  - 인증 여부에 따라 다른 화면으로 보내는 공개 route를 만들 때
tags: [auth, onboarding, redirect, join, login, latency, better-auth]
---

# Join CTA auth shortcut latency

## Context

랜딩과 공개 프로필의 CTA는 `/join`을 목적지로 사용한다. 사용자는 `/join` 자체를 보려고 클릭하는 것이 아니라, 비로그인 상태에서는 `/sign-up`, 로그인 상태에서는 앱 진입 화면으로 빠르게 이동하기를 기대한다.

기존 `/join` route는 shortcut route인데도 full `auth()`를 먼저 수행했다.

```text
/join
  -> auth()
  -> unauthenticated: /sign-up
  -> authenticated: resolveAuthenticatedAppRedirect(userId)
```

이 구조에서는 CTA 클릭 후 목적지 화면이 표시되기까지 `/join` 서버 인증 조회 비용이 먼저 붙는다. 이후 목적지인 `/sign-up` 또는 `/post-sign-in`에서도 다시 session 검증과 화면 렌더링이 실행되므로, 사용자는 로그인 여부와 상관없이 클릭 반응이 느리다고 느낄 수 있다.

## Root Cause

`/join`과 `/login`이 빠른 redirect shortcut 역할을 하면서도 `auth()`와 DB 기반 redirect 계산을 route handler 안에서 직접 수행했다.

문제 지점은 다음이었다.

| Route | Previous behavior | Latency source |
|---|---|---|
| `src/app/join/route.ts` | `auth()` 후 비로그인은 `/sign-up`, 로그인은 `resolveAuthenticatedAppRedirect` | Better Auth session 조회, 로그인 시 profile page DB 조회 |
| `src/app/login/route.ts` | `auth()` 후 비로그인은 `/sign-in`, 로그인은 `resolveAuthenticatedAppRedirect` | Better Auth session 조회, 로그인 시 profile page DB 조회 |

이 route들은 보안 경계가 아니다. 실제 보안 검증은 목적지인 `/post-sign-in`, `/sign-up`, `/sign-in`, 보호 app page에서 다시 수행된다. 따라서 shortcut route에서 full session validation을 반복할 필요가 없었다.

추가로 `/post-sign-in`은 redirect 전용 페이지인데 `(auth)` route group 아래에 있으면, `/join`에서 로그인 사용자를 `/post-sign-in`으로 보낼 때 auth layout이 잠깐 보일 수 있다. redirect 전용 라우트는 사용자에게 보여줄 auth shell을 갖지 않아야 한다.

## Fix

`/join`과 `/login`은 Better Auth session cookie signal만 보고 즉시 redirect하도록 바꿨다.

```text
/join
  -> session cookie exists: /post-sign-in
  -> no session cookie: /sign-up

/login
  -> session cookie exists: /post-sign-in
  -> no session cookie: /sign-in
```

변경 파일:

| File | Change |
|---|---|
| `src/app/join/route.ts` | `auth()`와 `resolveAuthenticatedAppRedirect` 제거, `getSessionCookie(request)` 기반 redirect |
| `src/app/login/route.ts` | `auth()`와 `resolveAuthenticatedAppRedirect` 제거, `getSessionCookie(request)` 기반 redirect |
| `src/app/post-sign-in/page.tsx` | `(auth)` route group 밖으로 이동해 중간 redirect 중 auth layout flash 제거 |

## Why This Is Safe

Session cookie signal은 UX 힌트로만 사용한다.

쿠키가 없으면 `/sign-up` 또는 `/sign-in`으로 바로 보낸다. 쿠키가 있으면 `/post-sign-in`으로 보낸다. `/post-sign-in`은 다시 `auth()`를 수행하고, 실제 session이 없으면 `/sign-in`으로 보낸다.

```text
stale cookie
  -> /join
  -> /post-sign-in
  -> auth()
  -> no valid session
  -> /sign-in
```

즉 shortcut route는 빠른 분기만 담당하고, 권한 판단은 기존 인증 경계가 계속 담당한다.

## Verification

변경 파일 대상 검사를 통과했다.

```text
bun x biome check \
  src/app/join/route.ts \
  src/app/login/route.ts \
  src/app/(auth)/layout.tsx \
  src/app/(auth)/sign-in/page.tsx \
  src/app/(auth)/sign-up/page.tsx \
  src/app/post-sign-in/page.tsx \
  src/app/sitemap.ts \
  src/app/robots.ts

git diff --check
```

전체 `bun run lint`는 기존 unrelated 파일들의 lint/format 이슈 때문에 실패할 수 있다. 이 해결의 검증은 변경 파일 단위로 분리해서 본다.

## Deployment Check

배포 후에는 브라우저 또는 curl로 `/join`이 실제 shortcut route로 동작하는지 확인한다.

```text
GET /join
  -> unauthenticated: redirect to /sign-up
  -> authenticated cookie signal: redirect to /post-sign-in
```

주의할 점: `/join`은 reserved handle이어야 하며, 공개 프로필 동적 route `/:handle`로 처리되면 안 된다. 배포 응답이 `@join` 같은 public profile HTML을 반환하면 shortcut route가 배포에 반영되지 않았거나 route 충돌이 있는 상태다.

## Related

- `docs/solutions/documentation-gaps/auth-navigation-and-cache-boundaries-2026-04-28.md`
- `docs/solutions/documentation-gaps/user-onboarding-and-auth-funnel-map-2026-04-28.md`
