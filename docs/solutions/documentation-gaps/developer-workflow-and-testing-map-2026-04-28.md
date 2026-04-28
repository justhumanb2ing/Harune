---
title: Developer workflow and testing context map
date: 2026-04-28
category: documentation-gaps
module: developer-workflow
problem_type: documentation_gap
component: development_workflow
severity: medium
applies_when:
  - 변경 후 어떤 검증을 돌릴지 결정할 때
  - 테스트 파일 위치와 회귀 테스트 의도를 파악할 때
  - lint, format, scripts, DB command 사용 방식을 확인할 때
tags: [testing, workflow, bun, biome, regression-tests, scripts]
---

# Developer workflow and testing context map

## Context
프로젝트는 Bun 기반으로 동작하고, Biome를 lint/format 도구로 쓴다. 테스트는 여러 도메인에 흩어져 있으며, 특히 profile-page persistence/cache, auth redirect, analytics range 같은 과거 회귀를 막는 테스트가 있다.

## Guidance
기본 명령은 다음과 같다.

```bash
bun install
bun run dev
bun run lint
bun run lint:fix
bun run build
bun run db:generate
bun run db:migrate
bun run db:push
```

일회성 스크립트는 bootstrap을 거쳐 실행한다.

```bash
bun run script scripts/measure-route-entry.ts
```

주요 설정 파일:

| File | Responsibility |
|---|---|
| `package.json` | Bun scripts and dependencies |
| `biome.json` | formatting/lint rules |
| `tsconfig.json` | TypeScript strict settings and `@/*` alias |
| `next.config.ts` | Sentry wrapper, image remote patterns, experimental flags |
| `scripts/_bootstrap/index.ts` | `bun run script` 공통 환경 로드 |

테스트 파일은 변경 도메인별로 찾는다.

| Area | Tests |
|---|---|
| Auth redirect/password | `src/lib/auth/*.test.ts`, `src/lib/validations/auth.schema.test.ts` |
| Profile editor/store/cache/upload | `src/components/section/profile-page/*.test.ts`, `src/lib/profile-page/*.test.ts` |
| Analytics | `src/lib/analytics/*.test.ts` |
| React Query app cache | `src/lib/react-query/app-cache.test.ts`, `src/lib/users/me-query-options.test.ts` |
| Website content source | `src/app/*source.test.ts` |
| Sidebar navigation | `src/components/sections/sidebar-navigation.test.tsx` |

## Why This Matters
이 프로젝트의 중요한 테스트는 단순 snapshot보다 회귀 방지 성격이 강하다. 예를 들어 profile-page cache regression test는 client fetch가 `cache: "no-store"`를 유지하는지 확인한다. 성능 최적화를 하면서 이 테스트를 깨면 기존 persistence 혼동이 되살아날 수 있다.

Biome 규칙은 일부 항목을 warn으로 두고 있다. `noUnusedImports`는 error이고, accessibility/security/style 관련 규칙은 경고가 많다. 자동 수정 후에는 lint를 다시 실행해 import 정리와 format 결과를 확인한다.

## When to Apply
- 변경한 영역에 맞는 최소 검증 세트를 고를 때
- 캐시, 인증, profile sync, analytics range를 바꿀 때
- DB schema 변경 후 migration 생성/적용 절차를 정할 때
- 새 스크립트를 `scripts/`에 추가할 때

## Examples
Profile page sync 관련 변경 후 최소 검증:

```bash
bun test src/lib/profile-page/profile-page-sync-schema.test.ts
bun test src/lib/profile-page/profile-page-cache-regression.test.ts
bun test src/components/section/profile-page/profile-page-editor-store.test.ts
bun run lint
```

Auth navigation 변경 후 최소 검증:

```bash
bun test src/lib/auth/proxy-auth-boundary.test.ts
bun test src/lib/auth/app-redirect.test.ts
bun test src/lib/users/me-query-options.test.ts
bun run lint
```

Analytics 변경 후 최소 검증:

```bash
bun test src/lib/analytics/analytics-ranges.test.ts
bun test src/lib/analytics/profile-page.test.ts
bun test src/lib/analytics/profile-page-summary.test.ts
bun run lint
```

## Related
- `docs/solutions/documentation-gaps/project-architecture-map-2026-04-28.md`
- `docs/solutions/documentation-gaps/auth-navigation-and-cache-boundaries-2026-04-28.md`
