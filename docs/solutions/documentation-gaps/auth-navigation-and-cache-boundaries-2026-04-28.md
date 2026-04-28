---
title: Auth navigation and cache boundaries
date: 2026-04-28
category: documentation-gaps
module: auth-navigation
problem_type: documentation_gap
component: authentication
severity: high
applies_when:
  - 로그인, post-sign-in, 보호 라우트, 인앱 네비게이션을 수정할 때
  - 인증 관련 성능 또는 redirect 문제를 디버깅할 때
  - TanStack Query hydration과 최신성 정책을 조정할 때
tags: [auth, navigation, proxy, better-auth, tanstack-query, cache]
---

# Auth navigation and cache boundaries

## Context
Harune은 Better Auth와 Next.js proxy를 함께 쓴다. Proxy는 빠른 redirect를 위해 session cookie 존재 여부만 보고, 실제 보호 API와 서버 경계는 `auth()`/`withAuthRequired`가 검증한다. 이 구분은 성능 개선과 보안 유지의 핵심이다.

## Guidance
인증 경계는 아래처럼 읽는다.

```text
Network request
  -> src/proxy.ts
  -> getProxyRouteDecision(cookie signal, URL)
  -> page/server/API boundary
  -> auth() or withAuthRequired()
```

`src/proxy.ts`는 다음 역할을 맡는다.

- `/app`, `/plan` 같은 legacy path를 `/post-sign-in`으로 보낸다.
- 인증 페이지에 이미 session signal이 있으면 `/post-sign-in`으로 보낸다.
- 보호 페이지에 session signal이 없으면 `/sign-in?callbackUrl=...`로 보낸다.
- full session validation은 하지 않는다.

실제 보안 검증은 다음 파일에서 유지한다.

| File | Responsibility |
|---|---|
| `src/auth.ts` | Better Auth 서버 설정과 `auth()` wrapper |
| `src/lib/auth/withAuthRequired.ts` | API route의 실제 session 검증과 lazy context 제공 |
| `src/app/post-sign-in/page.tsx` | 로그인 후 onboarding 또는 `/:handle/app`으로 이동 |
| `src/lib/auth/app-redirect.ts` | 보유 profile page 기준 app redirect 계산 |
| `src/lib/auth/app-redirect-paths.ts` | callback/next path 안전성 제한 |

캐시 경계는 데이터별로 다르게 본다.

| Data | Policy | Reason |
|---|---|---|
| `me` | 짧은 stale window와 server query option | 앱 shell에서 반복 조회를 줄임 |
| profile page editor data | `cache: "no-store"` client fetch, mutation 후 invalidation | 편집기 최신성이 중요함 |
| analytics | range/timezone 기준 query | 외부 API 비용과 freshness 균형 |
| public profile page | route revalidation 대상 | sync 후 공개 페이지 반영 필요 |

## Why This Matters
Proxy의 cookie signal은 UX 힌트이지 권한 증명이 아니다. 이 값을 보안 판단으로 승격하면 보호 API가 약해지고, 반대로 모든 network entry에서 full session을 다시 조회하면 앱 이동 성능이 나빠진다.

캐시도 마찬가지다. 앱 shell 데이터와 editor 데이터는 freshness 요구가 다르다. 전역 `staleTime`만 믿고 profile-page editor data를 오래 살리면 기존 persistence 회귀와 비슷한 증상이 다시 나타날 수 있다.

## When to Apply
- `src/proxy.ts` matcher를 바꿀 때
- `/sign-in`, `/sign-up`, `/post-sign-in`, `/create`, `/:handle/app` 이동을 바꿀 때
- `src/lib/react-query/*`, `src/lib/users/*query-options*`, `src/lib/profile-page/*query-options*`를 바꿀 때
- 성능 개선을 위해 prefetch 또는 hydration 범위를 조정할 때

## Examples
로그인 후 기본 이동은 다음처럼 해석한다.

```text
authenticated user
  -> /post-sign-in
  -> resolveAuthenticatedAppRedirect(userId, next, handle)
  -> no profile page: /create
  -> has profile page: /{handle}/app
```

보호 API는 proxy에 의존하지 않고 route handler에서 확인한다.

```text
GET /api/app/profile-page
  -> withAuthRequired(...)
  -> context.session.user.id
  -> getProfilePageEditorData(userId)
```

## Related
- `docs/plans/2026-04-27-001-refactor-navigation-session-performance-plan.md`
- `docs/solutions/logic-errors/profile-page-draft-sync-persistence-regression-2026-04-27.md`
