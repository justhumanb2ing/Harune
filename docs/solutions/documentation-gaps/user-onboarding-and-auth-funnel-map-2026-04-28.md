---
title: User onboarding and auth funnel context map
date: 2026-04-28
category: documentation-gaps
module: onboarding-auth
problem_type: documentation_gap
component: authentication
severity: high
applies_when:
  - 가입, 로그인, handle 선점, 온보딩 생성 흐름을 수정할 때
  - 로그인 후 사용자가 어느 화면으로 이동해야 하는지 판단할 때
  - 신규 사용자 funnel에서 이미지 업로드나 생성 실패를 디버깅할 때
tags: [onboarding, auth, sign-in, sign-up, handle, create-profile]
---

# User onboarding and auth funnel context map

## Context
Harune의 신규 사용자 흐름은 공개 랜딩에서 handle을 고르고, 인증을 거친 뒤, `/create` 온보딩에서 공개 프로필 페이지를 생성하는 구조다. 기존 문서는 인증 경계와 redirect helper를 설명하지만, 사용자가 실제로 지나가는 가입 funnel과 실패/rollback 흐름은 별도로 압축되어 있지 않았다.

## Guidance
사용자 기준 진입 흐름은 다음과 같다.

```text
Landing page /
  -> /join
  -> /sign-up or authenticated app redirect
  -> /sign-up?handle={handle}
  -> Better Auth sign-up
  -> /api/join?handle={handle}
  -> no profile page: /create?handle={handle}
  -> complete onboarding
  -> /create/success
  -> /{handle}
```

`/create/success`는 짧은 축하 진입점이다. 성공 직후 confetti 같은 celebratory motion을 보여주되, 복사 버튼과 page CTA 가독성은 유지해야 한다.

기존 사용자는 더 짧게 이동한다.

```text
/login
  -> unauthenticated: /sign-in
  -> authenticated: resolveAuthenticatedAppRedirect(userId)
  -> /{handle} or /create
```

주요 파일은 다음과 같다.

| File | User-facing responsibility |
|---|---|
| `src/app/(website-layout)/page.tsx` | 공개 랜딩과 `/join` CTA |
| `src/components/auth/sign-up-handle-form.tsx` | handle 입력, 정규화, availability check |
| `src/app/api/join/route.ts` | 비로그인 사용자는 `/sign-in`, 로그인 사용자는 app redirect |
| `src/app/(auth)/sign-in/page.tsx` | 로그인 화면, Google 사용 가능 여부, OAuth error 표시 |
| `src/app/(auth)/sign-up/page.tsx` | 회원가입 화면, handle/callback forwarding |
| `src/lib/auth/app-redirect.ts` | 인증 후 `/create` 또는 `/{handle}` 결정 |
| `src/app/(in-app)/create/page.tsx` | profile page가 없는 사용자만 온보딩 진입 |
| `src/components/auth/onboarding-form.tsx` | handle, profile, social links 3단계 생성 폼 |
| `src/app/api/create/route.ts` | 사용자 최초 profile page 생성 |

온보딩 단계는 세 개다.

| Step | Required state | Notes |
|---|---|---|
| Handle | 유효한 handle, availability success | 중복이면 409 또는 availability error |
| Profile | `name` 필수, avatar/background/bio/role/location 선택 | 이미지는 선택 즉시 preview, 제출 시 upload |
| Socials | social URL 선택 입력 | 비어 있는 social link는 생성하지 않음 |

이미지 업로드는 profile page 생성 전에 먼저 수행된다. 생성 API가 실패하면 이미 업로드된 이미지를 삭제하려고 시도한다.

```text
submit onboarding
  -> upload selected profile image
  -> upload selected background image
  -> POST /api/create
  -> success: invalidate authenticated app queries, /create/success
  -> failure: rollback uploaded images, /create/fail or step error
```

## Why This Matters
신규 사용자 funnel은 인증, handle availability, S3 upload, DB 생성이 한 번에 엮인다. 실패 지점을 잘못 해석하면 사용자는 계정은 있는데 페이지가 없거나, storage object만 생기고 profile page row는 없는 상태가 될 수 있다.

`handle`은 `/sign-up`, `/sign-in`, `/api/join`, `/create`를 통과하면서 query string으로 이어진다. 이 연결을 끊으면 사용자가 랜딩에서 고른 handle이 온보딩에 전달되지 않는다.

## When to Apply
- 랜딩 CTA, `/join`, `/login` 라우트를 바꿀 때
- Better Auth sign-in/sign-up callback URL을 바꿀 때
- `/create` 온보딩 단계, 입력 필드, 이미지 업로드를 바꿀 때
- handle validation, reserved handle, availability API를 바꿀 때

## Examples
신규 가입 redirect 문제를 디버깅할 때:

```text
1. /join이 /sign-up으로 보내는지 확인
2. handle query가 /sign-up 또는 /sign-in에 남는지 확인
3. AuthForm callbackUrl이 /api/join?...인지 확인
4. resolveAuthenticatedAppRedirect가 profile page 유무를 맞게 판단하는지 확인
5. /create가 이미 page 있는 사용자를 /{handle}로 보내는지 확인
```

온보딩 생성 실패를 디버깅할 때:

```text
1. handle availability와 server-side duplicate check가 같은 결과인지
2. image/background upload 중 어디서 실패했는지
3. upload 성공 후 /api/create가 실패했는지
4. rollback DELETE /api/profile/upload-image가 호출됐는지
5. 실패 시 /create/fail에 message가 전달됐는지
```

## Related
- `docs/solutions/documentation-gaps/auth-navigation-and-cache-boundaries-2026-04-28.md`
- `docs/solutions/documentation-gaps/profile-page-domain-map-2026-04-28.md`
- `docs/solutions/documentation-gaps/seo-content-and-media-map-2026-04-28.md`
