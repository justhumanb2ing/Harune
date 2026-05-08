# Harune Onboarding Guide

## What Is This?

`Harune`는 사용자가 자기 활동과 링크를 한 페이지에 모아 공유하는
link-in-bio 서비스입니다. 퍼블릭 웹사이트, 인증, 인앱 대시보드,
결제/크레딧, 문서/블로그(MDX)까지 기본 구조가 포함되어 있습니다.

---

## User Experience

사용자 기준 주요 흐름은 다음과 같습니다.

1. 랜딩 페이지(`/(website-layout)`)에서 기능/가격/정책/블로그를 확인합니다.
2. `sign-in`, `sign-up`, `magic link` 기반 인증 후 인앱(`/(in-app)`)으로 진입합니다.
3. 인앱에서 플랜 구독, 크레딧 구매/사용, 프로필 관리 작업을 수행합니다.

문서형 콘텐츠(`docs`, `blog`)가 함께 포함되어 있어 마케팅 사이트와 제품 앱을
동일 리포에서 운영할 수 있습니다.

---

## How Is It Organized?

아키텍처 개요:

```text
Browser
  |
  | HTTP
  v
Next.js App Router
(src/app/*)
  |
  | server actions / route handlers
  v
Domain Modules
(src/lib/*, src/auth.ts)
  |
  v
External APIs / services
```

디렉터리 구조:

```text
src/
  app/                 # 라우트, 레이아웃, API 핸들러
    (website-layout)/  # 랜딩/블로그/정책/문의
    (in-app)/          # 로그인 사용자 앱 화면
    api/               # HTTP API 엔드포인트
  lib/                 # 도메인 로직(결제, 크레딧, SEO, 세션 등)
  components/          # 공용 UI 및 섹션 컴포넌트
  content/             # MDX/정책 콘텐츠
```

주요 모듈:

| Module | Responsibility |
|---|---|
| `src/auth.ts` | Better Auth 서버 설정 및 세션 처리 |
| `src/lib/seo/index.ts` | canonical/OG/Twitter 메타 공통 생성 |
| `src/app/sitemap.ts` | 사이트맵 생성 |
| `src/app/robots.ts` | robots 정책 생성 |

외부 의존성:

| Dependency | What it's used for | Configured via |
|---|---|---|
| Better Auth | 인증/세션 관리 | `AUTH_SECRET`, `BETTER_AUTH_URL` |
| Stripe/Paddle/PayPal/Dodo | 결제 처리(선택) | 각 결제사 env 변수 |
| AWS S3 | 파일 업로드(선택) | `AWS_*` |
| Sentry | 에러 모니터링(선택) | `SENTRY_*` |

---

## Key Concepts and Abstractions

| Concept | What it means in this codebase |
|---|---|
| `website-layout` | 로그인 전 공개 페이지 묶음 |
| `in-app` | 로그인 후 제품 기능 영역 |
| `createPageMetadata` | 페이지별 SEO 메타를 일관되게 생성하는 헬퍼 |
| `absoluteUrl` | 경로를 절대 URL(canonical/JSON-LD)로 변환 |
| `auth()` | 현재 세션을 가져오는 서버 유틸 |
| `policy content` | `src/content/policies/*`의 법적 문서 MDX |

---

## Primary Flows

대표 사용자 플로우(가입 후 인앱 진입):

```text
User opens landing page
  |
  v
src/app/(website-layout)/page.tsx
  |
  v
Sign-in or magic-link request
src/app/(auth)/*
  |
  v
Auth session resolved
src/auth.ts
  |
  v
App pages render with user data
src/app/(in-app)/*
```

대표 SEO 플로우(페이지 메타 생성):

1. 페이지 파일에서 `createPageMetadata({ path, title, description })` 호출
2. `src/lib/seo/index.ts`가 canonical/OG/Twitter 공통값 생성
3. `layout.tsx`의 `metadataBase`와 결합되어 절대 URL 메타 출력
4. `sitemap.ts`, `robots.ts`가 같은 URL 규칙(`absoluteUrl`) 사용

---

## Developer Guide

설정:

```bash
bun install
cp .env.example .env.local
bun run dev
```

검증:

```bash
bun run lint
bun run build
```

자주 하는 변경:

1. 새 공개 페이지 추가
- `src/app/(website-layout)/.../page.tsx` 생성
- `createPageMetadata`로 메타 지정
- 필요하면 `src/app/sitemap.ts`에 경로 추가

2. 인증/권한 로직 변경
- `src/auth.ts`와 `src/lib/auth/*`에서 처리
- 보호 라우트는 `src/proxy.ts` 정책 확인

처음 읽기 좋은 파일:

| Area | File | Why |
|---|---|---|
| 글로벌 메타/Provider | `src/app/layout.tsx` | 앱 공통 런타임 설정 확인 |
| SEO 공통 규칙 | `src/lib/seo/index.ts` | SEO 커스터마이징 시작점 |
| 인증 | `src/auth.ts` | 로그인/세션 핵심 흐름 파악 |
| 공개 사이트 레이아웃 | `src/app/(website-layout)/layout.tsx` | 랜딩 계층 구조 이해 |

실무 팁:
- 새 페이지 추가 시 `metadata`와 JSON-LD를 같이 맞추면 SEO 누락이 줄어듭니다.
- 환경변수 추가 시 `src/env.ts`와 `.env.example`를 항상 같이 갱신하세요.
- `bun run lint:fix` 후 `bun run lint`를 다시 돌려 무결성을 확인하세요.
