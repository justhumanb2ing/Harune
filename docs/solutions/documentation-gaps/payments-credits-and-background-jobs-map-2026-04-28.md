---
title: Payments credits and background jobs context map
date: 2026-04-28
category: documentation-gaps
module: payments-credits
problem_type: documentation_gap
component: payments
severity: medium
applies_when:
  - 구독, 결제 provider, credits, webhook, Inngest 작업을 수정할 때
  - template scaffold와 실제 활성 product flow를 구분해야 할 때
  - 금전/원장성 데이터를 다루기 전에 읽을 컨텍스트가 필요할 때
tags: [payments, credits, paddle, dodo, stripe, inngest]
---

# Payments credits and background jobs context map

## Context
이 프로젝트에는 Paddle, Dodo Payments, Stripe, LemonSqueezy, PayPal 관련 scaffold가 공존한다. 실제 기능을 연결할 때는 “provider helper가 존재한다”와 “제품 플로우에서 활성 사용 중이다”를 구분해야 한다. Credits 시스템도 원장과 만료 job은 있지만 현재 `enableCredits = false`다.

## Guidance
결제 관련 시작점은 다음과 같다.

| Area | Files | Notes |
|---|---|---|
| Paddle checkout | `src/lib/paddle/*`, `src/app/(in-app)/subscribe/paddle/*` | transaction checkout과 customer portal helper |
| Dodo checkout | `src/lib/dodopayments/*`, `src/app/(in-app)/subscribe/billing-form/*` | billing 정보 기반 one-time/subscription/credit checkout |
| Stripe | `src/lib/stripe/index.ts`, `src/app/api/webhooks/stripe/route.ts` | client bootstrap와 webhook route |
| Plans | `src/db/schema/core/plans.ts`, `src/lib/plans/*` | provider별 price/product id가 한 테이블에 모임 |
| Credits | `src/lib/credits/*`, `src/db/schema/core/credits.ts` | credit type, pricing, transaction ledger |
| Background jobs | `src/lib/inngest/*`, `src/app/api/inngest/route.ts` | credits expiration job 포함 |

Credits 모델은 두 계층으로 나뉜다.

```text
credit_transactions
  -> append-only-ish ledger: credit, debit, expired

app_user.credits
  -> current balance snapshot
```

`recalculateUserCredits(userId)`는 ledger에서 snapshot을 다시 계산한다. `addCreditTransaction(...)`은 transaction row를 만들고 user snapshot을 갱신한다.

Credit expiration job은 Inngest cron이다.

```text
expireCredits
  -> cron 0 2 * * *
  -> if enableCredits === false: skip
  -> find expiring credit transactions
  -> add expired transaction with paymentId expired_{originalId}
```

## Why This Matters
결제와 credit은 금전성 데이터다. provider별 helper를 복사해 쓰기 전에 webhook idempotency, customer id 저장 위치, product/price id, user id custom data, ledger 중복 방지 정책을 확인해야 한다.

현재 credits 기능은 비활성화되어 있으므로, UI를 켜기 전에 만료 job, 구매 route, webhook credit 부여, insufficient balance 처리까지 end-to-end로 이어져 있는지 확인해야 한다.

## When to Apply
- `src/app/(in-app)/subscribe/*`를 변경할 때
- provider webhook route를 구현하거나 수정할 때
- `plans` schema 또는 provider price id를 바꿀 때
- credits 구매/소비/만료를 실제 제품 기능에 연결할 때

## Examples
구독 checkout을 바꿀 때 확인할 항목:

```text
1. plan row에 provider price/product id가 있는지
2. checkout helper가 user id를 provider metadata/customData에 싣는지
3. success/error redirect URL이 현재 route와 맞는지
4. webhook에서 user/customer/subscription id를 저장하는지
5. 중복 webhook이 같은 효과를 두 번 내지 않는지
```

Credits를 활성화하기 전 확인할 항목:

```text
1. enableCredits 값을 켤 제품 조건이 정해졌는지
2. creditTypeSchema와 UI가 같은 type set을 쓰는지
3. purchase webhook이 addCredits를 호출하는지
4. feature 사용 시 deductCredits를 호출하는지
5. expireCredits job이 실제 Inngest route에 등록됐는지
```

## Related
- `docs/solutions/documentation-gaps/data-model-and-migration-map-2026-04-28.md`
