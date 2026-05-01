---
title: Join CTA auth shortcut latency
date: 2026-04-28
category: logic-errors
module: onboarding-auth
problem_type: performance_regression
component: authentication
severity: medium
applies_when:
  - 랜딩 CTA의 `/api/join` shortcut route를 수정할 때
  - CTA 클릭 후 목적지 화면 표시가 느린 문제를 디버깅할 때
  - 인증 여부에 따라 다른 화면으로 보내는 공개 route를 만들 때
tags: [auth, onboarding, redirect, join, login, latency, better-auth]
---

# Join CTA auth shortcut latency

## Context

랜딩과 공개 프로필의 CTA는 `/api/join`을 목적지로 사용한다. 사용자는 `/api/join` 자체를 보려고 클릭하는 것이 아니라, 비로그인 상태에서는 `/sign-in`, 로그인 상태에서는 앱 진입 화면으로 빠르게 이동하기를 기대한다.

기존 join shortcut route는 shortcut route인데도 full `auth()`를 먼저 수행했다.

```text
/api/join
  -> auth()
  -> unauthenticated: /sign-in
  -> authenticated: resolveAuthenticatedAppRedirect(userId)
```

이 구조에서는 CTA 클릭 후 목적지 화면이 표시되기까지 join route의 서버 인증 조회 비용이 먼저 붙는다. 이후 목적지인 `/sign-in`에서도 다시 session 검증과 화면 렌더링이 실행되므로, 사용자는 로그인 여부와 상관없이 클릭 반응이 느리다고 느낄 수 있다.

## Root Cause

join shortcut이 빠른 redirect shortcut 역할을 하면서도 `auth()`와 DB 기반 redirect 계산을 route handler 안에서 직접 수행했다.

문제 지점은 다음이었다.

| Route | Previous behavior | Latency source |
|---|---|---|
| `src/app/api/join/route.ts` | `auth()` 후 비로그인은 `/sign-in`, 로그인은 `resolveAuthenticatedAppRedirect` | Better Auth session 조회, 로그인 시 profile page DB 조회 |

이 route는 보안 경계가 아니다. 실제 보안 검증은 목적지인 `/sign-in`, `/create`, owner analytics page, 보호 API에서 다시 수행된다. 따라서 shortcut route에서 full session validation을 반복할 필요가 없었다.

현재 redirect 전용 경로는 `/api/join` route handler가 맡는다. 사용자에게 보여줄 auth shell을 갖지 않아야 한다.

## Fix

`/api/join`은 Better Auth session cookie signal만 보고 즉시 redirect하도록 바꾼다.

```text
/api/join
  -> session cookie exists: resolveAuthenticatedAppRedirect
  -> no session cookie: /sign-in?callbackUrl=/api/join
```

변경 파일:

| File | Change |
|---|---|
| `src/app/api/join/route.ts` | session/callback forwarding과 authenticated app redirect |

## Why This Is Safe

Session cookie signal은 UX 힌트로만 사용한다.

쿠키가 없으면 `/sign-in`으로 바로 보낸다. 쿠키가 있으면 `/api/join`이 `auth()`와 `resolveAuthenticatedAppRedirect`를 수행한다.

```text
stale cookie
  -> /api/join
  -> auth()
  -> no valid session
  -> /sign-in
```

즉 shortcut route는 빠른 분기만 담당하고, 권한 판단은 기존 인증 경계가 계속 담당한다.

## Verification

변경 파일 대상 검사를 통과했다.

```text
bun x biome check \
  src/app/api/join/route.ts \
  src/app/(auth)/layout.tsx \
  src/app/(auth)/sign-in/page.tsx \
  src/app/(auth)/sign-up/page.tsx \
  src/app/sitemap.ts \
  src/app/robots.ts

git diff --check
```

전체 `bun run lint`는 기존 unrelated 파일들의 lint/format 이슈 때문에 실패할 수 있다. 이 해결의 검증은 변경 파일 단위로 분리해서 본다.

## Deployment Check

배포 후에는 브라우저 또는 curl로 `/api/join`이 실제 shortcut route로 동작하는지 확인한다.

```text
GET /api/join
  -> unauthenticated: redirect to /sign-in?callbackUrl=/api/join
  -> authenticated: redirect to /{handle} or /create
```

주의할 점: `/api/join`은 API route여야 하며, 공개 프로필 동적 route `/:handle`로 처리되면 안 된다.

## Related

- `docs/solutions/documentation-gaps/auth-navigation-and-cache-boundaries-2026-04-28.md`
- `docs/solutions/documentation-gaps/user-onboarding-and-auth-funnel-map-2026-04-28.md`
