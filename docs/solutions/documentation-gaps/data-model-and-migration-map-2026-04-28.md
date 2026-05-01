---
title: Data model and migration context map
date: 2026-04-28
category: documentation-gaps
module: database
problem_type: documentation_gap
component: database
severity: medium
applies_when:
  - Drizzle schema, migration, data persistence behavior를 수정할 때
  - profile_page, auth, plans, credits 테이블 관계를 빠르게 파악할 때
  - DB 변경이 기존 회귀 문서와 연결되는지 확인할 때
tags: [database, drizzle, migrations, schema, persistence]
---

# Data model and migration context map

## Context
이 프로젝트는 Drizzle ORM과 PostgreSQL을 사용한다. `src/db/schema/core/*`가 현재 핵심 schema이고, 루트 `src/db/schema/*.ts` 파일은 일부 re-export 또는 확장 진입점처럼 쓰인다. DB 변경은 제품 동작에 직접 닿으므로 schema, migration, 관련 domain mutation을 함께 봐야 한다.

## Guidance
DB 시작점은 다음 순서로 확인한다.

```text
src/db/index.ts
src/db/schema/core/*
src/db/schema/extensions/*
drizzle.config.ts
drizzle/*.sql
drizzle/meta/*.json
```

핵심 테이블은 다음과 같다.

| Table | Schema file | Notes |
|---|---|---|
| `app_user` | `src/db/schema/core/user.ts` | Better Auth user + 결제 customer ids + credits snapshot |
| `auth_account` | `src/db/schema/core/user.ts` | Better Auth account link |
| `auth_session` | `src/db/schema/core/user.ts` | Better Auth sessions |
| `auth_verification` | `src/db/schema/core/user.ts` | Better Auth verification |
| `profile_page` | `src/db/schema/core/profile-page.ts` | 사용자의 공개 페이지 metadata, handle unique |
| `profile_social_link` | `src/db/schema/core/profile-page.ts` | platform unique per page, position unique per page |
| `profile_link_item` | `src/db/schema/core/profile-page.ts` | 일반 링크 아이템, position unique per page |
| `profile_text_box_item` | `src/db/schema/core/profile-page.ts` | 텍스트 블록, position unique per page |
| `plans` | `src/db/schema/core/plans.ts` | multi-provider pricing id와 quotas |
| `credit_transactions` | `src/db/schema/core/credits.ts` | credit/debit/expired 원장 |

Drizzle 명령은 `bun`을 기준으로 실행한다.

```bash
bun run db:generate
bun run db:migrate
bun run db:push
```

DB 변경 시 같이 확인할 파일은 다음과 같다.

| Change | Also check |
|---|---|
| auth user/session schema | `src/auth.ts`, Better Auth adapter schema |
| profile page schema | `src/lib/profile-page/queries.ts`, `src/lib/profile-page/mutations.ts`, validation schemas |
| position/index 변경 | reorder/sync helper의 temporary negative position 전략 |
| plans schema | `src/lib/plans/*`, subscription checkout route |
| credits schema | `src/lib/credits/*`, `src/lib/inngest/functions/expire-credits.ts` |

## Why This Matters
이 리포의 과거 회귀는 네트워크 응답과 실제 persisted DB state가 달라지는 문제였다. DB를 바꿀 때는 mutation response보다 정상 read path와 직접 row 상태를 기준으로 검증해야 한다.

Unique position index가 있는 collection은 재정렬 중 임시 충돌이 생길 수 있다. 현재 코드는 기존 position을 음수로 밀어낸 뒤 새 position을 쓰는 방식으로 이 문제를 피한다.

## When to Apply
- `src/db/schema/core/*` 또는 `drizzle/*.sql`을 수정할 때
- API response가 맞는데 refresh 후 값이 사라지는 문제를 디버깅할 때
- profile page child collection의 추가/삭제/정렬 로직을 바꿀 때
- 결제 provider 또는 credits 기능을 실제 product flow에 연결할 때

## Examples
Profile page persistence 검증은 아래 순서가 안전하다.

```text
1. mutation payload
2. route handler validation
3. domain mutation write
4. normal DB read path
5. direct DB row
6. client cache/store rebase
```

새 social platform을 추가할 때는 enum과 타입을 함께 바꾼다.

```text
src/db/schema/core/profile-page.ts
src/lib/profile-page/types.ts
src/components/icon/*
src/hooks/use-profile-page-editor.ts
src/lib/validations/profile-page.schema.ts
```

## Related
- `docs/solutions/logic-errors/profile-page-draft-sync-persistence-regression-2026-04-27.md`
- `docs/solutions/logic-errors/profile-page-image-url-persistence-regression-2026-04-25.md`
