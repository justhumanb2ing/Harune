---
title: Project architecture context map
date: 2026-04-28
category: documentation-gaps
module: project-architecture
problem_type: documentation_gap
component: documentation
severity: medium
applies_when:
  - 처음 프로젝트를 파악하거나 새 작업의 영향 범위를 정할 때
  - 라우트, 도메인 로직, DB, 컴포넌트 중 어디부터 읽을지 결정할 때
  - 컨텍스트 압축 후에도 프로젝트의 큰 구조를 복원해야 할 때
tags: [architecture, nextjs, app-router, context-map, onboarding]
---

# Project architecture context map

## Context
Harune은 Next.js App Router 기반 link-in-bio 제품이다. 공개 랜딩, 인증, 인앱 편집기, 공개 프로필, 분석, 결제/크레딧, MDX 콘텐츠가 한 리포 안에 있어 새 작업의 시작점을 빠르게 잘라내기 어렵다.

이 문서는 전체 구조를 압축해서, 새 세션이 프로젝트의 큰 지도를 먼저 복원할 수 있게 한다.

## Guidance
핵심 런타임 흐름은 다음 순서로 읽는다.

```text
Browser
  -> src/app/* route, layout, route handler
  -> src/components/* UI and feature surface
  -> src/lib/* domain logic, integrations, cache policy
  -> src/db/* Drizzle connection and schema
  -> PostgreSQL / external services
```

주요 디렉터리 책임은 다음과 같다.

| Path | Responsibility | Start here when |
|---|---|---|
| `src/app` | App Router 라우트, 레이아웃, API route, 메타데이터 | URL, redirect, SSR, route handler 변경 |
| `src/app/(auth)` | 로그인/회원가입/post sign-in 화면 | 인증 화면과 가입 후 이동 변경 |
| `src/app/(in-app)` | 로그인 후 앱 내부 화면 | 편집기, 분석, 구독 화면 변경 |
| `src/app/(public-profile)` | 공개 핸들 페이지와 소셜 이미지 | 공개 프로필 렌더링, OG/Twitter 이미지 변경 |
| `src/app/(website-layout)` | 공개 랜딩/정책/마케팅 페이지 | 랜딩, 정책, 공개 콘텐츠 변경 |
| `src/components/profile-page` | 프로필 페이지 편집기와 공개 렌더러 | 페이지 빌더 UI, draft, public profile 변경 |
| `src/components/ui` | shadcn/base UI 계층 | 공용 UI primitive 변경 |
| `src/lib` | 도메인 로직과 외부 연동 | 비즈니스 규칙, API helper, 캐시 정책 변경 |
| `src/db/schema` | Drizzle schema 진입점 | 테이블/인덱스/관계 변경 |
| `docs/plans` | 기능 계획과 의사결정 기록 | 큰 변경의 배경 파악 |
| `docs/solutions` | 해결된 문제와 재사용 지식 | 구현/디버깅 전 유사 문제 탐색 |

현재 주요 도메인 모듈은 다음과 같다.

| Module | Key files | Notes |
|---|---|---|
| Auth | `src/auth.ts`, `src/proxy.ts`, `src/lib/auth/*` | Better Auth, cookie-signal proxy, protected API validation |
| Profile page | `src/lib/profile-page/*`, `src/components/profile-page/*` | 제품의 핵심 편집/공개 렌더링 도메인 |
| Analytics | `src/lib/analytics/*`, `src/components/analytics/*` | Umami 기반 공개 프로필 조회/클릭 수집 |
| Payments | `src/lib/paddle/*`, `src/lib/dodopayments/*`, `src/lib/stripe/*` | 여러 결제 provider가 공존 |
| Credits | `src/lib/credits/*`, `src/lib/inngest/functions/expire-credits.ts` | 현재 `enableCredits = false`, 기능은 준비 상태 |
| Storage | `src/lib/s3/*`, `src/components/ui/s3-uploader/*` | AWS 또는 Supabase S3 호환 업로드 |
| SEO/content | `src/lib/seo/*`, `src/content/*`, `src/app/sitemap.ts`, `src/app/robots.ts` | 공개 페이지 메타/정책/MDX |

## Why This Matters
이 프로젝트는 template 흔적과 실제 제품 코드가 섞여 있다. 예를 들어 README에는 boilerplate 성격의 결제/DB 확장 설명이 남아 있고, 제품명은 `src/lib/config.ts`의 `appConfig.projectName`인 Harune을 기준으로 본다. 일부 오래된 plan/test fixture에는 Leeve 표현이 남아 있으므로 작업 전 관련 도메인 문서를 먼저 읽으면 “실제 제품 경로”와 “아직 옵션 또는 scaffold인 경로”를 구분하기 쉽다.

## When to Apply
- 새 기능을 추가하기 전에 영향 범위를 잡을 때
- 오래된 계획 문서와 현재 코드가 다를 수 있어 현재 truth source를 찾아야 할 때
- 라우트 그룹, 도메인 모듈, DB schema 중 어느 계층을 수정해야 할지 애매할 때

## Examples
프로필 편집기 변경은 보통 아래 파일군을 함께 확인한다.

```text
src/app/(public-profile)/[handle]/*
src/components/profile-page/*
src/lib/profile-page/*
src/app/api/profile/*
src/db/schema/core/profile-page.ts
```

인증 이동 변경은 아래 순서로 읽는다.

```text
src/proxy.ts
src/lib/auth/proxy-auth-boundary.ts
src/app/api/join/route.ts
src/lib/auth/app-redirect.ts
src/lib/auth/withAuthRequired.ts
```

## Related
- `docs/solutions/documentation-gaps/auth-navigation-and-cache-boundaries-2026-04-28.md`
- `docs/solutions/documentation-gaps/profile-page-domain-map-2026-04-28.md`
- `docs/solutions/documentation-gaps/data-model-and-migration-map-2026-04-28.md`
