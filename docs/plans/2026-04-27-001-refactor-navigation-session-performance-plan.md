---
title: refactor: Improve navigation and session performance
type: refactor
status: completed
date: 2026-04-27
deepened: 2026-04-27
---

# refactor: Improve navigation and session performance

## Overview

Next.js App Router, Better Auth, and TanStack Query usage를 정리해 로그인 이후 앱 내부 이동을 더 빠르고 예측 가능하게 만든다. 핵심 방향은 `proxy.ts`의 세션 검증 비용을 줄이고, 보호된 서버 라우트에서 보안 검증을 유지하며, 앱 내부의 주요 화면 데이터를 서버에서 선취득해 HydrationBoundary로 전달하고, 사용자가 실제로 이동할 가능성이 높은 링크만 의도적으로 prefetch하는 것이다.

## Problem Frame

현재 앱은 `src/proxy.ts`에서 보호 페이지와 `/api/app/*` 요청마다 `auth()`를 호출한다. 이후 `src/app/(in-app)/(sidebar)/[handle]/app/layout.tsx`, `src/app/(in-app)/(sidebar)/[handle]/analytics/page.tsx`, `src/app/(auth)/post-sign-in/page.tsx`, `src/lib/auth/withAuthRequired.ts`도 다시 세션을 조회한다. 이 구조는 보안상 명확하지만, 페이지 이동과 API 호출의 시작 지점에서 반복적인 세션 조회가 발생해 체감 이동 속도와 서버 부하에 불리하다.

TanStack Query는 이미 `queryOptions`, 서버 prefetch, `HydrationBoundary`를 일부 사용하지만, `/api/me`, profile-page, analytics 데이터의 freshness 정책과 서버/클라이언트 초기 데이터 전달 방식이 화면마다 다르다. Link prefetch도 Next.js 기본값에 대부분 맡겨져 있어 앱 내부의 높은 확률 이동과 낮은 확률 이동을 구분하지 못한다.

## Requirements Trace

- R1. 앱 내부 Link 이동은 사용자가 클릭했을 때 즉시 반응하는 느낌을 줘야 한다.
- R2. Link prefetch는 Next.js App Router의 자동 prefetch를 활용하되, 서버 비용이 큰 동적/보호 경로와 대량 링크는 무분별하게 prefetch하지 않아야 한다.
- R3. 인증 보안 경계는 약화하지 않는다. `proxy.ts`에서 빠른 UX용 판별을 하더라도 보호된 페이지와 API route에서는 실제 세션 검증을 유지한다.
- R4. `/api/me`와 profile-page 관련 사용자 데이터는 중복 조회를 줄이고 TanStack Query 캐시와 서버 hydration의 단일한 정책 아래 동작해야 한다.
- R5. 기존 캐시 회귀 방지 원칙을 유지한다. 프로필 편집처럼 최신성이 중요한 데이터는 브라우저 fetch 캐시와 오래된 클라이언트 캐시에 묶이지 않아야 한다.
- R6. 리팩토링은 기존 라우트 URL, 로그인 callback, onboarding redirect, 공개 프로필 URL을 깨지 않아야 한다.
- R7. 모든 앱 라우트는 network 단계에서 1000ms 이내에 진입 가능한 구조여야 한다. 여기서 "진입"은 구현 전 측정 기준으로 navigation/request 시작부터 첫 서버 응답, redirect 결정, 또는 route shell streaming 시작까지의 상한으로 정의하고, 구현 중 Playwright/Network timing으로 검증한다.

## Scope Boundaries

- 인증 공급자, 회원가입 방식, DB 스키마, 결제 플로우는 변경하지 않는다.
- UI 재설계가 목적이 아니다. Link/preload behavior와 데이터 준비 방식을 바꾸는 데 필요한 최소 UI 상태만 조정한다.
- 공개 프로필 페이지의 SEO/메타데이터 전략은 이번 범위 밖이다. 단, sync 이후 revalidation과 앱 내부 캐시 무효화는 유지한다.
- TanStack Query를 서버 상태의 중심으로 정리하되, profile-page editor store 자체를 React Query로 대체하지 않는다.

## Context & Research

### Relevant Code and Patterns

- `src/proxy.ts`: 현재 모든 보호 페이지, `/api/app/*`, auth page, legacy redirect를 처리하며 요청마다 `auth()`를 호출한다.
- `src/auth.ts`: Better Auth 서버 설정과 `auth()` wrapper. `session.cookieCache`가 이미 활성화되어 있다.
- `src/lib/auth/withAuthRequired.ts`: API route별 실제 세션 검증과 user/currentPlan lazy loader를 제공한다.
- `src/app/(auth)/post-sign-in/page.tsx`: 로그인 이후 handle 보유 여부에 따라 `/create` 또는 `/:handle/app`으로 redirect한다.
- `src/app/(in-app)/(sidebar)/[handle]/app/layout.tsx`: profile-page 데이터를 서버에서 prefetch하고 `HydrationBoundary`로 전달한다.
- `src/app/(in-app)/(sidebar)/[handle]/analytics/page.tsx`: profile-page와 analytics를 서버에서 prefetch한다.
- `src/lib/react-query/query-client.ts`: 브라우저 QueryClient singleton과 기본 `staleTime: 60_000`을 제공한다.
- `src/lib/users/queries.ts`, `src/lib/profile-page/query-options.ts`, `src/lib/analytics/query-options.ts`: 클라이언트 queryOptions 패턴이 이미 있다.
- `src/lib/profile-page/profile-page-cache-regression.test.ts`: `cache: "no-store"` 회귀 테스트가 있으며 이번 리팩토링에서도 최신성 요구를 보존해야 한다.

### Institutional Learnings

- `docs/solutions/logic-errors/profile-page-draft-sync-persistence-regression-2026-04-27.md`: mutation 응답이나 캐시만 믿으면 실제 persist 상태와 UI가 어긋날 수 있었다. 이번 리팩토링은 "빠른 이동"을 위해 캐시를 늘리더라도, 프로필 편집/동기화 데이터는 정상 post-write read와 명시적 invalidation을 통해 최신성 의미를 잃지 않게 해야 한다.
- `docs/solutions/logic-errors/profile-page-image-url-persistence-regression-2026-04-25.md`: 이미지/프로필 상태는 cache-busting과 저장 완료 의미가 중요하다. 앱 shell 최적화가 이 최신성 경계를 침범하지 않도록 profile-page query의 stale 정책은 별도 관리한다.

### External References

- Context7에서 Next.js는 현재 설치 버전 `16.1.7`과 가장 가까운 공식 문서 snapshot `v16.1.6`을 사용했다. TanStack Query는 현재 설치 버전 `5.99.0`과 가장 가까운 공식 문서 snapshot `v5.90.3`을 사용했다.
- Next.js 16 Link docs: `<Link>`는 viewport 진입 시 route를 background prefetch하며, 정적 route는 full prefetch, 동적 route는 skip 또는 `loading.tsx`가 있을 때 partial prefetch된다. 대량 링크나 비용이 큰 route는 `prefetch={false}`로 자동 prefetch를 끌 수 있다.
- Next.js 16 caching/navigation docs: `router.prefetch(href)`는 RSC payload를 Router Cache에 넣어 이후 이동을 빠르게 하지만, Data Cache나 Full Route Cache를 직접 바꾸지는 않는다.
- Next.js 16 Proxy docs: Next.js 16에서 middleware 명칭이 proxy로 바뀌었고, `proxy.ts`는 request 완료 전 redirect/rewrite/response를 수행하는 네트워크 경계다.
- TanStack Query v5 advanced SSR docs: Next.js App Router에서는 Server Component에서 `QueryClient`를 만들고 `prefetchQuery` 후 `dehydrate`/`HydrationBoundary`로 Client Component에 전달하는 패턴을 권장한다. 서버에서 prefetch하지 않는 query와 섞는 것도 가능하다.
- TanStack Query v5 important defaults docs: 기본 query는 stale로 간주되며 `staleTime`으로 refetch 빈도를 제어한다. v5는 `cacheTime` 대신 inactive query GC를 `gcTime`으로 표현한다.
- Better Auth Next.js docs: Proxy/middleware에서는 빠른 redirect를 위해 session cookie 존재 여부만 확인할 수 있지만, 이것은 보안 검증이 아니므로 보호된 page/route에서 실제 세션 검증을 유지해야 한다. Next.js 16 proxy에서는 full session validation도 가능하다.

## Existing vs Proposed Comparison

| Area | Current approach | Proposed approach | Why proposed is better |
|------|------------------|-------------------|------------------------|
| Proxy auth check | `src/proxy.ts`가 보호 페이지와 `/api/app/*` 요청마다 `auth()`로 full session 조회 | Proxy는 legacy redirect, auth page redirect, UX용 cookie/cache 기반 optimistic redirect 중심으로 축소하고 API/page 서버 경계에서 full session 검증 유지 | 요청 시작점의 반복 세션 조회를 줄여 TTFB와 API fan-out 비용을 줄인다. 보안 검증은 `withAuthRequired`와 보호 page loader에 남기므로 권한 경계가 유지된다. |
| API protection | Proxy와 `withAuthRequired`가 `/api/app/*`에서 중복 세션 검증 | `/api/app/*`의 보안 판단은 `withAuthRequired`를 신뢰하고 proxy의 API 매칭 제거 또는 cookie-only fast reject로 축소 | API request마다 proxy + route handler 이중 조회를 피한다. 인증 실패 응답은 route handler에서 일관된 JSON으로 유지된다. |
| App shell session | sidebar/app/analytics/post-sign-in에서 각자 `auth()`와 profile lookup 수행 | 앱 내부 서버 layout에서 session/profile bootstrap을 더 명확히 분리하고, 하위 화면은 hydrated query와 shared redirect helper를 사용 | 동일 이동 중 session/profile 조회 경로가 줄고, redirect 규칙이 한 곳에 모인다. |
| Link movement | 대부분 기본 `<Link>` prefetch에 맡김 | 앱 내부 핵심 nav는 의도적으로 prefetch하고, 외부/낮은 확률/비싼 동적 route는 `prefetch={false}` 또는 hover/focus manual prefetch로 조절 | Next.js 자동 prefetch의 장점은 살리면서 서버 작업 낭비와 auth-heavy prefetch를 줄인다. |
| Query hydration | 일부 route에서 서버 prefetch 사용, `/api/me`는 클라이언트 fetch 중심 | app bootstrap에 필요한 `me`/profile-page query는 서버 hydration 또는 initialData 정책을 통일하고, analytics처럼 비싼 데이터는 route 단위 prefetch 유지 | 첫 화면 skeleton/중복 fetch를 줄이고, query key 단위 invalidation이 더 예측 가능해진다. |
| Query freshness | 전역 `staleTime: 60_000`; 중요 query가 일부 no-store | query별 `staleTime`/`gcTime` 정책을 분리: `me`는 짧은 fresh window, editor data는 mutation 후 명시 invalidation, analytics는 route/기간 기준 fresh window | 성능과 최신성 요구가 다른 데이터를 같은 정책으로 묶지 않는다. |
| Network entry budget | 라우트별 network timing 예산이 명시되어 있지 않음 | 모든 route에 1000ms 진입 예산을 두고 proxy/auth/query prefetch 작업을 이 예산 안에서 배치 | 최적화가 체감 개선으로 이어지는지 측정 가능해지고, auth/query 중복 제거가 명확한 성능 목표에 연결된다. |

## Key Technical Decisions

- Proxy는 보안의 최종 경계가 아니라 빠른 라우팅 경계로 다룬다: Better Auth 문서의 cookie-only proxy 경고를 반영해 proxy에서 full DB-backed session check를 줄이더라도 보호 page와 API route의 `auth()`/`withAuthRequired` 검증은 유지한다.
- `/api/app/*` matcher는 제거하거나 최소화한다: 현재는 proxy와 route handler가 둘 다 세션을 확인한다. API 보안은 `withAuthRequired`가 더 좁은 실행 컨텍스트와 JSON error contract를 가지므로 route handler에 두는 편이 낫다.
- App 내부 핵심 이동은 Next Link 기반으로 유지한다: Next.js는 `<Link>` 자동 prefetch와 Router Cache를 제공하므로 `router.push` 버튼 이동은 명령형 action이 필요한 경우에만 사용하고, nav 목적의 이동은 Link로 통일한다.
- Dynamic protected route prefetch는 선택적으로 만든다: `/:handle/app`, `/:handle/analytics`는 auth/session/profile 조회 비용이 있는 동적 route다. sidebar의 현재/다음 주요 탭처럼 클릭 확률이 높은 링크는 prefetch 이득이 크지만, 대량 렌더링되는 public/profile 링크에는 prefetch 비용이 더 클 수 있다.
- TanStack Query queryOptions를 서버/클라이언트 간 공유 가능한 단위로 정리한다: 현재 profile-page는 server/client options가 나뉘어 있고 queryKey는 공유한다. 이 패턴을 유지하되 `me`, profile-page, analytics의 freshness와 hydration 책임을 문서화하고 중복 query 생성 방식을 줄인다.
- 최신성 민감 데이터는 캐시보다 명시적 invalidation을 우선한다: profile-page sync 이후 `queryKeys.app.profilePage()`와 `queryKeys.app.me()`의 관계를 명확히 하며, `cache: "no-store"` 회귀 테스트를 유지한다.
- Server Component prefetch는 client-only query module을 직접 import하지 않는다: `src/lib/users/queries.ts`는 `"use client"`와 `apiFetch`에 묶여 있으므로, `me` hydration은 server-only loader/queryOptions를 새로 두고 client query와 queryKey/data shape만 공유한다.
- 1000ms network entry budget은 route shell을 우선한다: analytics처럼 비용이 큰 데이터는 route 진입을 막지 않도록 streaming/loading boundary나 client-side background fetch 후보로 분리하고, route 접근 권한과 최소 shell 구성에 필요한 데이터만 blocking path에 둔다.

## Alternative Approaches Considered

- Keep full `auth()` in proxy for every protected request: 보안 판단 위치가 단순하지만 `/api/app/*`와 protected page에서 route handler/page loader가 다시 검증하므로 중복 비용이 크다. 이번 계획은 proxy를 UX redirect 경계로 낮추고 실제 보안 검증은 좁은 서버 경계에 남긴다.
- Disable all Link prefetch globally: 서버 비용 예측은 쉬워지지만 Next.js App Router의 Router Cache 이점을 버리게 된다. 핵심 앱 nav는 빠른 이동이 중요하므로 selective prefetch가 낫다.
- Move all server state into one `/api/app/bootstrap` query: 첫 화면 구성은 단순해지지만 profile editor, analytics, currentPlan의 freshness와 invalidation 경계가 섞인다. 이번 계획은 queryKey는 명확히 나누고, server hydration으로 첫 fetch 비용만 줄인다.

## Success Metrics

- `/api/app/*` 요청에서 proxy와 route handler가 모두 full session 조회를 수행하는 중복 경로가 제거된다.
- 로그인 후 `/:handle/app` 최초 진입에서 sidebar가 `/api/me` cold fetch 완료 전까지 빈 사용자 상태를 보여주지 않는다.
- `/:handle/app` ↔ `/:handle/analytics` 이동은 핵심 nav prefetch 또는 segment loading으로 즉시 반응 상태를 보여준다.
- 기존 `/api/me` 401 JSON, `/sign-in?callbackUrl=...`, `/post-sign-in`, `/app` legacy redirect 동작은 유지된다.
- profile-page cache regression 테스트는 계속 통과하며 sync 이후 editor 데이터 최신성은 약화되지 않는다.
- 보호/공개/auth 주요 라우트의 network entry timing은 local production build 기준 p95 1000ms 이하를 목표로 측정된다.

## Open Questions

### Resolved During Planning

- Proxy에서 full session validation을 완전히 제거해도 되는가: API route는 `withAuthRequired`가 실제 검증을 하므로 가능하다. Page route는 서버 layout/page에서 `auth()`를 유지해야 하며, proxy는 미인증 사용자를 빠르게 로그인으로 보내는 UX 역할로 제한한다.
- Link prefetch를 전역적으로 끌 것인가: 아니다. Next.js 자동 prefetch는 핵심 UX 이점이 있으므로 고비용/저확률 link만 끈다.
- 서버 prefetch를 모든 query에 적용할 것인가: 아니다. TanStack Query 문서상 서버 prefetch하지 않는 query와 섞을 수 있으며, interaction 이후에만 필요한 데이터는 client fetch로 남기는 것이 낫다.

### Deferred to Implementation

- Better Auth cookie helper로 `getSessionCookie`와 `getCookieCache` 중 무엇을 사용할지: 현재 cookie naming/custom prefix 실제 동작과 타입 호환성을 구현 중 확인해야 한다.
- `me` query를 어느 layout에서 hydrate할지: App Router segment 구조상 `src/app/(in-app)/layout.tsx` 또는 `src/app/(in-app)/(sidebar)/layout.tsx` 중 children remount와 redirect 책임이 더 작은 위치를 구현 중 확인한다.
- 수동 `router.prefetch`를 hover/focus에 붙일지, 핵심 nav Link의 기본 prefetch만으로 충분한지: 구현 중 실제 nav 컴포넌트 구조와 테스트 가능성에 따라 결정한다.
- 1000ms budget의 정확한 측정 항목: 계획상 기본값은 request start -> first response/redirect/streamed shell start이다. 구현 중 Playwright Navigation Timing과 Next.js server timing에서 가장 안정적으로 반복 측정 가능한 지표를 확정한다.

## High-Level Technical Design

> *This illustrates the intended approach and is directional guidance for review, not implementation specification. The implementing agent should treat it as context, not code to reproduce.*

```mermaid
sequenceDiagram
  participant User
  participant Link as Next Link / Router Cache
  participant Proxy as src/proxy.ts
  participant Page as Protected Server Layout/Page
  participant API as /api/app route handlers
  participant Query as TanStack Query Cache

  User->>Link: Hover/viewport/click core app nav
  Link->>Link: Prefetch eligible RSC payload
  User->>Proxy: Navigate to protected route
  Proxy->>Proxy: Legacy redirect and optimistic auth redirect only
  Proxy->>Page: Continue request
  Page->>Page: Full auth() validation
  Page->>Query: Prefetch only entry-critical data
  Query->>User: Hydrated client data
  User->>API: Mutations or no-store reads
  API->>API: withAuthRequired full validation
  API->>Query: Client invalidates affected query keys
```

## Implementation Units

- [x] **Unit 1: Characterize current auth and cache behavior**

**Goal:** Proxy, protected page, `/api/me`, profile-page query의 현재 보안/캐시 contract를 테스트로 고정한다.

**Requirements:** R3, R5, R6, R7

**Dependencies:** None

**Files:**
- Modify: `src/proxy.ts`
- Modify: `src/lib/auth/withAuthRequired.ts`
- Test: `src/lib/auth/app-redirect.test.ts`
- Test: `src/lib/profile-page/profile-page-cache-regression.test.ts`
- Test: `src/lib/auth/proxy-auth-boundary.test.ts`

**Approach:**
- 리팩토링 전에 legacy redirect, sign-in callback, auth page redirect, `/api/me` unauthorized JSON, profile-page no-store 동작을 테스트로 고정한다.
- `proxy.ts`의 pure helper를 테스트 가능한 형태로 분리하는 것은 허용하되, 이 unit의 목적은 behavior characterization이다.

**Execution note:** Add characterization coverage before changing proxy/session behavior.

**Patterns to follow:**
- `src/lib/profile-page/profile-page-cache-regression.test.ts`
- `src/lib/auth/app-redirect.ts`

**Test scenarios:**
- Happy path: `/app` 요청은 `/post-sign-in`으로 legacy redirect된다.
- Happy path: 로그인된 사용자가 `/sign-in?callbackUrl=/create`에 접근하면 `/post-sign-in?next=/create` 계열로 redirect된다.
- Error path: 미인증 `/api/me` 요청은 JSON 401 contract를 유지한다.
- Integration: profile-page client query는 `cache: "no-store"`를 유지한다.
- Edge case: `callbackUrl=//evil.example` 같은 외부 redirect 시도는 내부 fallback으로 정규화된다.
- Integration: 주요 route의 network timing 측정을 위한 smoke harness가 route별 request start와 first response/redirect timing을 기록한다.

**Verification:**
- 리팩토링 전후로 보호 경계와 redirect contract가 동일하게 설명 가능하다.
- 구현 전 baseline과 구현 후 timing을 비교할 수 있는 측정 기준이 존재한다.

- [x] **Unit 2: Reduce proxy session work without weakening auth**

**Goal:** `src/proxy.ts`의 full session 조회 범위를 줄이고, 보안 검증은 route/page 경계에 남긴다.

**Requirements:** R2, R3, R6, R7

**Dependencies:** Unit 1

**Files:**
- Modify: `src/proxy.ts`
- Modify: `src/auth.ts`
- Test: `src/lib/auth/proxy-auth-boundary.test.ts`

**Approach:**
- `/api/app/:path*`는 matcher에서 제거하거나 cookie-only fast reject로 제한한다. 최종 보안과 JSON 응답은 `withAuthRequired`가 담당한다.
- 보호된 page route는 proxy에서 session cookie/cache 기반 optimistic redirect를 수행하고, 실제 page/layout에서는 `auth()` 검증을 유지한다.
- auth page redirect는 cookie/cache만으로 충분한지 검토하되, stale cookie로 잘못 redirect될 수 있는 경우 `/post-sign-in`에서 full `auth()`가 최종 정리하도록 둔다.
- Next.js 16 proxy 명칭과 matcher semantics를 유지한다.

**Patterns to follow:**
- `src/proxy.ts`의 `hasPathPrefix`, `getLegacyRedirectPath`, `createSignInUrl`
- Better Auth Next.js cookie-based proxy guidance

**Test scenarios:**
- Happy path: session cookie가 없는 보호 page 요청은 `/sign-in?callbackUrl=...`로 redirect된다.
- Happy path: session cookie가 있는 보호 page 요청은 proxy를 통과하고 page/layout full auth 검증으로 넘어간다.
- Error path: session cookie가 있지만 실제 session이 만료된 경우 page/layout 또는 API route가 sign-in/401을 처리한다.
- Integration: `/api/me`는 proxy 변경 후에도 `withAuthRequired`에서 401 JSON을 반환한다.
- Edge case: legacy `/plan/*`, `/app/*` redirect는 유지된다. 제거된 `/section` route 호환 redirect는 다시 추가하지 않는다.
- Integration: proxy에서 처리되는 redirect-only route는 full session validation 없이 1000ms budget 안에서 redirect decision을 반환한다.

**Verification:**
- Proxy 단계에서 DB-backed session 조회가 줄고, 보호 API/page의 실제 auth 검증은 사라지지 않는다.
- proxy가 route entry latency의 blocking bottleneck이 되지 않는다.

- [x] **Unit 3: Normalize app bootstrap query hydration**

**Goal:** 로그인 이후 앱 shell에서 필요한 `me`와 profile-page 데이터를 서버 prefetch 또는 initialData 정책으로 일관되게 제공한다.

**Requirements:** R1, R4, R5, R6, R7

**Dependencies:** Unit 2

**Files:**
- Modify: `src/app/(in-app)/layout.tsx`
- Modify: `src/app/(in-app)/(sidebar)/layout.tsx`
- Modify: `src/app/(in-app)/(sidebar)/[handle]/app/layout.tsx`
- Modify: `src/app/(in-app)/(sidebar)/[handle]/analytics/page.tsx`
- Create: `src/lib/users/server-query-options.ts`
- Create: `src/lib/users/me.ts`
- Modify: `src/lib/users/queries.ts`
- Modify: `src/lib/profile-page/server-query-options.ts`
- Modify: `src/lib/profile-page/query-options.ts`
- Test: `src/lib/profile-page/profile-page-cache-regression.test.ts`
- Test: `src/lib/users/me-query-options.test.ts`

**Approach:**
- TanStack Query의 App Router SSR 패턴에 맞춰 Server Component에서 필요한 query만 prefetch하고 `HydrationBoundary`로 전달한다.
- `src/lib/users/queries.ts`는 client-only `apiFetch` module로 유지하고, server prefetch용 `me` 데이터는 `server-only` loader와 `server-query-options`로 분리한다.
- `meQueryOptions`에 session/user/profilePage/currentPlan의 freshness 요구를 명시한다. profile-page editor는 sync 후 최신성이 중요하므로 no-store와 invalidation을 유지한다.
- 서버 queryOptions와 클라이언트 queryOptions가 같은 queryKey와 compatible data shape를 공유하도록 정리한다.
- `Sidebar`의 `useUser()`가 첫 렌더에서 불필요한 pending 상태를 보이지 않도록 hydrated data를 활용한다.

**Patterns to follow:**
- `src/app/(in-app)/(sidebar)/[handle]/app/layout.tsx`
- `src/app/(in-app)/(sidebar)/[handle]/analytics/page.tsx`
- `src/lib/react-query/query-client.ts`

**Test scenarios:**
- Happy path: 서버에서 hydrated `me` data가 있으면 `useUser()`는 즉시 user/profilePage를 읽는다.
- Happy path: server-only `me` query option은 `src/lib/users/queries.ts`를 import하지 않고도 client `meQueryOptions()`와 같은 queryKey/data shape를 생성한다.
- Happy path: profile-page layout prefetch 결과와 client `profilePageQueryOptions()` queryKey가 같아 중복 cold fetch를 줄인다.
- Error path: `/api/me`가 401이면 client query error가 기존 `ApiError.status`를 유지한다.
- Integration: profile-page sync 후 `queryKeys.app.profilePage()` invalidation은 editor data를 새로 읽게 한다.
- Edge case: 사용자가 profilePage가 없으면 `/create` redirect가 유지된다.
- Integration: `/:handle/app` entry path는 entry-critical `me`/profile shell 데이터만 blocking하고, 나머지 데이터는 hydration 이후 fetch 또는 nested route prefetch로 분리된다.

**Verification:**
- 앱 내부 최초 진입에서 sidebar/profile editor가 서버 제공 데이터를 사용하고, 이후 mutation invalidation이 기존 최신성 contract를 깨지 않는다.
- 앱 내부 최초 진입의 blocking server work가 1000ms budget을 넘지 않도록 query prefetch 범위가 제한된다.

- [x] **Unit 4: Tune navigation prefetch policy**

**Goal:** Link 이동의 체감 속도를 높이되 auth-heavy dynamic route prefetch와 대량 링크 prefetch 비용을 통제한다.

**Requirements:** R1, R2, R6, R7

**Dependencies:** Unit 3

**Files:**
- Modify: `src/components/sections/sidebar.tsx`
- Modify: `src/components/layout/app-header.tsx`
- Modify: `src/components/section/profile-page/section-page-client.tsx`
- Modify: `src/components/section/profile-page/public-profile-page.tsx`
- Modify: `src/components/auth/auth-form.tsx`
- Test: `src/components/sections/sidebar-navigation.test.tsx`

**Approach:**
- Sidebar의 핵심 탭(`/:handle/app`, `/:handle/analytics`)은 Link 기반 이동을 유지하고, 필요하면 hover/focus에서 `router.prefetch`를 호출한다.
- 공개 프로필의 외부/저확률 링크, auth 페이지 전환처럼 서버 비용 대비 이득이 작은 링크는 `prefetch={false}` 적용 후보로 본다.
- form submit 성공 후 redirect처럼 명령형 흐름이 필요한 곳은 `router.push`/`router.replace`를 유지하되, 불필요한 `router.refresh()`가 hydration/invalidation과 중복되는지 검토한다.
- `loading.tsx`가 없는 dynamic route는 Next.js가 partial prefetch를 제한할 수 있으므로, 핵심 route에는 segment-level loading UI 추가를 검토한다.

**Patterns to follow:**
- `src/components/sections/sidebar.tsx`
- `src/components/section/profile-page/section-page-client.tsx`
- Next.js Link and router.prefetch guidance

**Test scenarios:**
- Happy path: sidebar nav Link는 올바른 `href`와 `aria-current`를 유지한다.
- Happy path: handle이 없을 때 nav href는 `/post-sign-in` fallback을 유지한다.
- Edge case: 대량 렌더링되는 public profile link에는 원치 않는 app route prefetch가 붙지 않는다.
- Integration: sign-out/delete-account 후 query cache와 router state가 stale authenticated UI를 표시하지 않는다.
- Integration: 핵심 nav 이동은 prefetched route 또는 loading shell을 통해 1000ms 이내 entry feedback을 제공한다.

**Verification:**
- 핵심 앱 탭 이동은 Link/Router Cache 이점을 활용하고, 비용 큰 route는 명시 정책으로 통제된다.
- prefetch 정책이 1000ms entry budget 달성에 기여하며 서버 작업 낭비를 만들지 않는다.

- [x] **Unit 5: Add route loading and transition fallbacks where prefetch cannot fully cover latency**

**Goal:** 동적 보호 route에서 prefetch가 skip/partial일 때도 사용자가 앱이 멈췄다고 느끼지 않도록 segment loading UI를 추가한다.

**Requirements:** R1, R2, R7

**Dependencies:** Unit 4

**Files:**
- Create: `src/app/(in-app)/(sidebar)/[handle]/app/loading.tsx`
- Create: `src/app/(in-app)/(sidebar)/[handle]/analytics/loading.tsx`
- Modify: `src/app/(in-app)/(sidebar)/[handle]/app/layout.tsx`
- Modify: `src/app/(in-app)/(sidebar)/[handle]/analytics/page.tsx`
- Test: `src/app/(in-app)/(sidebar)/[handle]/app/loading.test.tsx`

**Approach:**
- Next.js dynamic route prefetch behavior상 `loading.tsx`가 있으면 partial prefetch와 streaming UX에 도움이 된다.
- 기존 `SectionLayoutFallback`과 analytics layout 구조를 재사용해 skeleton이 실제 화면 밀도와 맞게 보이도록 한다.
- fallback은 데이터를 새로 가져오지 않고 순수 UI로 유지한다.

**Patterns to follow:**
- `src/app/(in-app)/(sidebar)/[handle]/app/layout.tsx`의 `SectionLayoutFallback`
- 기존 UI primitives in `src/components/ui/skeleton.tsx`

**Test scenarios:**
- Happy path: loading component는 profile editor shell의 안정적인 높이/폭 구조를 유지한다.
- Happy path: analytics loading은 sidebar와 하단 mobile action 영역을 침범하지 않는다.
- Edge case: mobile viewport에서도 loading UI가 fixed bottom preview drawer와 겹치지 않는다.
- Integration: analytics 데이터가 1000ms 안에 준비되지 않아도 analytics route shell은 loading 상태로 먼저 진입한다.

**Verification:**
- 동적 route 이동 중 서버 응답을 기다리는 동안 명확한 fallback이 표시된다.
- 비싼 데이터가 route shell 진입을 1000ms 이상 막지 않는다.

- [x] **Unit 6: Consolidate query invalidation after auth and profile mutations**

**Goal:** 로그인, 로그아웃, onboarding, profile sync 이후 Query Cache와 Router Cache가 일관되게 갱신되도록 한다.

**Requirements:** R1, R4, R5, R6, R7

**Dependencies:** Unit 3

**Files:**
- Modify: `src/components/auth/auth-form.tsx`
- Modify: `src/components/auth/onboarding-form.tsx`
- Modify: `src/components/sections/sidebar.tsx`
- Modify: `src/components/section/profile-page/use-profile-page-editor.ts`
- Modify: `src/lib/react-query/query-keys.ts`
- Test: `src/lib/profile-page/profile-page-cache-regression.test.ts`
- Test: `src/lib/users/me-query-options.test.ts`

**Approach:**
- auth state 변경 후에는 `queryKeys.app.me()`와 profile-page 관련 query를 명시적으로 reset/invalidate한다.
- profile sync 성공 후에는 profile-page query를 committed-read response 기준으로 갱신하고, 필요한 경우 `me`의 `profilePage` preview fields도 invalidate한다.
- `router.refresh()`는 서버 component tree 갱신이 필요한 경우에만 유지하고, TanStack Query invalidation과 중복되는 곳은 줄인다.

**Patterns to follow:**
- `src/components/section/profile-page/use-profile-page-editor.ts`
- `src/components/auth/onboarding-form.tsx`
- `src/lib/users/useUser.ts`

**Test scenarios:**
- Happy path: onboarding 성공 후 `me` query는 새 profilePage handle을 반영한다.
- Happy path: profile image/name 변경 후 sidebar avatar/name은 stale 값을 유지하지 않는다.
- Error path: sign-out 실패 시 cache는 authenticated 상태를 임의로 지우지 않는다.
- Integration: sign-out 성공 후 authenticated query cache가 남아 sidebar가 이전 사용자를 표시하지 않는다.
- Integration: auth/profile mutation 후 follow-up navigation은 cache reset/refresh 중복으로 1000ms entry budget을 초과하지 않는다.

**Verification:**
- auth/profile 상태 전환 후 Router Cache와 Query Cache가 서로 다른 사용자를 보여주지 않는다.

## System-Wide Impact

- **Interaction graph:** `src/proxy.ts` -> protected app layouts/pages -> `withAuthRequired` API routes -> TanStack Query cache -> sidebar/profile editor UI가 영향을 받는다.
- **Error propagation:** Proxy는 redirect 중심이고, API errors는 `withAuthRequired`와 `apiFetch`의 `ApiError` contract를 유지해야 한다.
- **State lifecycle risks:** session cookie는 optimistic signal일 뿐이다. stale cookie가 있어도 page/API full auth 검증에서 만료 session을 차단해야 한다.
- **API surface parity:** `/api/app/*`의 401 JSON contract, `/sign-in?callbackUrl=...`, `/post-sign-in?next=...`, legacy `/app`/`/plan` redirect를 유지한다.
- **Integration coverage:** page navigation, sign-in, sign-out, onboarding, profile sync 이후 cache invalidation은 단위 테스트만으로 부족할 수 있어 browser smoke check가 필요하다.
- **Performance budget:** 모든 route는 network entry 1000ms budget을 공유한다. route shell과 권한 검증에 필요한 blocking work만 남기고, analytics summary나 non-critical profile details는 streaming/loading/client fetch로 분리한다.
- **Unchanged invariants:** public profile URL `/:handle`, authenticated app URL `/:handle/app`, analytics URL `/:handle/analytics`, profile sync persistence semantics는 유지한다.

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Cookie-only proxy check를 보안 검증으로 오해할 수 있음 | 보호 page와 API route에서 full `auth()`/`withAuthRequired` 검증을 유지하고 테스트에 stale cookie scenario를 포함한다. |
| Prefetch가 보호 route 서버 작업을 과도하게 유발할 수 있음 | 핵심 nav만 prefetch 후보로 두고, 대량/저확률 링크는 `prefetch={false}` 또는 manual prefetch로 제한한다. |
| Hydration data와 client queryFn data shape가 어긋날 수 있음 | server/client queryOptions가 같은 queryKey와 serializable data shape를 쓰는지 테스트한다. |
| 캐시 staleTime 조정이 profile editor 최신성을 깨뜨릴 수 있음 | 기존 no-store 회귀 테스트와 sync 후 invalidation 테스트를 유지한다. |
| `router.refresh()` 제거가 서버 component 갱신을 누락할 수 있음 | auth/profile 전환별로 Query Cache invalidation과 Router Cache refresh 책임을 명확히 나눠 검증한다. |
| 1000ms budget이 데이터 완비 요구로 오해될 수 있음 | budget은 route entry/shell 기준으로 정의하고, 비핵심 데이터 완성은 별도 loading/hydration 상태로 분리한다. |

## Documentation / Operational Notes

- README 업데이트는 필수는 아니지만, 구현 후 `ONBOARDING.md` 또는 개발 문서에 "proxy는 UX redirect, route/page는 보안 검증" 원칙을 짧게 추가하는 것을 검토한다.
- 성능 검증은 수동 네트워크 패널에서 `/api/me`, `/api/profile`, auth session 조회 호출 수가 이동 전후 어떻게 변했는지 비교한다.
- 구현 검증에는 주요 route별 network entry timing 표를 포함한다. 최소 대상은 `/`, `/sign-in`, `/sign-up`, `/post-sign-in`, `/create`, `/:handle/app`, `/:handle/analytics`, `/:handle`, `/api/me`, `/api/profile`다.
- 배포 전 로그인, 로그아웃, 회원가입 후 onboarding, profile sync, `/app` legacy redirect, `/sign-in?callbackUrl=...`를 smoke test한다.

## Sources & References

- Related code: `src/proxy.ts`
- Related code: `src/auth.ts`
- Related code: `src/lib/auth/withAuthRequired.ts`
- Related code: `src/app/(in-app)/(sidebar)/[handle]/app/layout.tsx`
- Related code: `src/app/(in-app)/(sidebar)/[handle]/analytics/page.tsx`
- Related code: `src/lib/react-query/query-client.ts`
- Related code: `src/lib/profile-page/profile-page-cache-regression.test.ts`
- Institutional learning: `docs/solutions/logic-errors/profile-page-draft-sync-persistence-regression-2026-04-27.md`
- Next.js Link docs: https://github.com/vercel/next.js/blob/v16.1.6/docs/01-app/03-api-reference/02-components/link.mdx
- Next.js linking/navigation docs: https://github.com/vercel/next.js/blob/v16.1.6/docs/01-app/01-getting-started/04-linking-and-navigating.mdx
- Next.js caching docs: https://github.com/vercel/next.js/blob/v16.1.6/docs/01-app/02-guides/caching.mdx
- Next.js Proxy docs: https://github.com/vercel/next.js/blob/v16.1.6/docs/01-app/01-getting-started/16-proxy.mdx
- TanStack Query advanced SSR docs: https://github.com/tanstack/query/blob/v5.90.3/docs/framework/react/guides/advanced-ssr.md
- TanStack Query important defaults docs: https://github.com/tanstack/query/blob/v5.90.3/docs/framework/react/guides/important-defaults.md
- Better Auth Next.js integration docs: https://better-auth.com/docs/integrations/next#cookie-based-checks-recommended-for-all-versions
