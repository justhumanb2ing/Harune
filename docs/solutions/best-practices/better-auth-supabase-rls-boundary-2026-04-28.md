---
title: Better Auth and Supabase RLS boundary
date: 2026-04-28
category: best-practices
module: auth-database-rls
problem_type: best_practice
component: authentication
severity: high
applies_when:
  - Better Auth 세션을 유지하면서 Supabase RLS를 추가할 때
  - Supabase Data API 또는 browser Supabase client 접근을 설계할 때
  - 인증 route guard와 DB row policy의 책임 경계를 판단할 때
tags: [better-auth, supabase, rls, jwt, drizzle, authorization]
---

# Better Auth and Supabase RLS boundary

## Context
Harune은 Better Auth를 사용자와 세션의 원천으로 사용하고, Drizzle/PostgreSQL 스키마를 앱 서버에서 직접 다룬다. Supabase RLS를 추가할 때 핵심은 Better Auth를 Supabase Auth로 바꾸는 것이 아니라, Supabase exposed role이 DB에 직접 접근하는 경우에만 Better Auth JWT를 row policy의 입력으로 쓰는 것이다.

이번 구현은 `auth()`, `withAuthRequired`, `/:handle/app` route guard를 제거하지 않고 유지했다. RLS는 DB row 접근 방어층이고, 앱 라우팅/redirect/API error contract는 Next.js와 Better Auth 경계가 계속 담당한다.

## Guidance
Better Auth + Supabase RLS는 세 층으로 나누어 설계한다.

```text
App auth and UX
  -> Better Auth cookie session
  -> auth(), withAuthRequired(), route/layout guard

Supabase direct access
  -> Better Auth JWT plugin
  -> sub = app_user.id, role = authenticated, aud = authenticated

Database enforcement
  -> RLS policy reads auth.jwt() ->> 'sub'
  -> SQL GRANT/REVOKE limits exposed role privileges
```

Better Auth JWT 설정은 별도 파일로 분리해 테스트 가능하게 둔다.

```ts
export const betterAuthSupabaseJwtOptions = {
  jwt: {
    audience: "authenticated",
    expirationTime: "15m",
    definePayload: ({ user }) => ({
      email: user.email,
      role: "authenticated",
    }),
    getSubject: ({ user }) => user.id,
  },
} satisfies JwtOptions;
```

RLS helper는 Supabase의 UUID 전용 `auth.uid()` 대신 text-safe subject 비교를 사용한다. 현재 `app_user.id`와 profile owner columns가 `text`이기 때문이다.

```ts
export const currentBetterAuthUserId = sql`nullif(auth.jwt() ->> 'sub', '')`;

export const isCurrentBetterAuthUser = (userIdColumn: AnyPgColumn) =>
  sql`${currentBetterAuthUserId} = ${userIdColumn}`;
```

테이블 분류는 기본적으로 닫고 필요한 surface만 연다.

| Table group | Exposed role policy |
|---|---|
| `app_user`, Better Auth internals, `jwks` | no anon/authenticated policy |
| `credit_transactions`, `coupon` | no anon/authenticated policy |
| `profile_page` and child tables | public select, owner insert/update/delete |
| `plans` | public select only |

RLS policy만으로는 충분하지 않다. Supabase exposed role이 테이블에 broad privilege를 갖고 있으면 policy와 privilege drift가 생길 수 있으므로 migration에 `REVOKE`/`GRANT`를 같이 둔다.

```sql
REVOKE ALL ON TABLE "auth_account", "auth_session", "auth_verification",
  "app_user", "jwks", "credit_transactions", "profile_page",
  "profile_social_link", "profile_link_item", "profile_text_box_item", "plans"
FROM "anon", "authenticated";

GRANT SELECT ON TABLE "profile_page", "profile_social_link",
  "profile_link_item", "profile_text_box_item", "plans"
TO "anon", "authenticated";

GRANT INSERT, UPDATE, DELETE ON TABLE "profile_page", "profile_social_link",
  "profile_link_item", "profile_text_box_item"
TO "authenticated";
```

Optional extension table은 기본 migration 대상에 없을 수 있다. 이미 운영 DB에 존재할 가능성이 있는 extension table은 guarded SQL로 닫아 둔다.

```sql
DO $$
BEGIN
  IF to_regclass('public.coupon') IS NOT NULL THEN
    ALTER TABLE "coupon" ENABLE ROW LEVEL SECURITY;
    REVOKE ALL ON TABLE "coupon" FROM "anon", "authenticated";
  END IF;
END $$;
```

## Why This Matters
RLS를 추가했다고 앱 레벨 권한 코드를 제거하면 UX와 보안 책임이 섞인다. 예를 들어 `/:handle/app`은 단순히 row가 보이는지 확인하는 화면이 아니라, signed-in user의 canonical handle, onboarding redirect, unauthorized API contract를 결정한다. RLS deny result만 보고 이 결정을 대체하면 사용자는 빈 화면이나 모호한 DB error를 보게 되고, 서버 API의 계약도 깨진다.

반대로 RLS 없이 프론트나 route handler만 믿으면 Supabase Data API, future browser client, 운영 도구 실수 같은 경로에서 DB row가 방어되지 않는다. Better Auth JWT subject와 SQL privilege를 함께 묶으면 앱 UX와 DB least privilege가 각각 자기 역할을 하게 된다.

## When to Apply
- Supabase exposed schema에 app-owned table을 열 때
- Better Auth JWT plugin을 Supabase access token source로 쓸 때
- Drizzle schema에 `enableRLS()` 또는 `pgPolicy()`를 추가할 때
- public profile처럼 공개 read와 owner write가 공존하는 테이블을 설계할 때
- 결제, credit, coupon, auth session처럼 client direct access를 열면 안 되는 테이블을 분류할 때

## Examples
검증은 policy 선언만 보지 말고 아래 네 가지를 같이 확인한다.

```text
1. Better Auth JWT contract
   -> sub, role, aud가 의도한 값인지 unit test

2. Drizzle table config
   -> enableRLS와 policy 이름이 schema matrix와 일치하는지 unit test

3. Generated migration SQL
   -> CREATE POLICY, REVOKE, GRANT가 같이 존재하는지 test

4. Project checks
   -> bun test
   -> bun x drizzle-kit check
   -> targeted biome check on changed files
```

이번 변경 검증 결과:

```text
bun test
  -> 75 pass, 0 fail

bun x drizzle-kit check
  -> Everything's fine

bun x biome check [changed implementation/test/docs files]
  -> No fixes applied

git diff --check
  -> no whitespace errors
```

남은 운영 전제는 실제 Supabase 프로젝트 설정이다. Migration은 Supabase의 `auth.jwt()` helper와 `anon`/`authenticated` roles를 전제로 한다. Supabase가 Better Auth JWKS 또는 선택한 JWT issuer를 신뢰하도록 설정한 뒤, staging에서 anon, owner, non-owner, privileged server path를 smoke test해야 한다.

## Related
- `docs/solutions/documentation-gaps/auth-navigation-and-cache-boundaries-2026-04-28.md`
- `docs/solutions/documentation-gaps/data-model-and-migration-map-2026-04-28.md`
- `docs/solutions/documentation-gaps/profile-page-domain-map-2026-04-28.md`
- `docs/plans/2026-04-28-001-feat-supabase-rls-better-auth-plan.md`
