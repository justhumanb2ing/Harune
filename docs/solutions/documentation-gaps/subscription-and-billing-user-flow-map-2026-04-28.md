---
title: Subscription and billing user flow context map
date: 2026-04-28
category: documentation-gaps
module: subscription-billing
problem_type: documentation_gap
component: payments
severity: high
applies_when:
  - 구독 시작, billing form, provider checkout, billing portal을 수정할 때
  - 결제 성공/실패 redirect와 webhook 처리의 사용자 영향을 확인할 때
  - provider별 현재 지원 상태를 구분해야 할 때
tags: [subscription, billing, checkout, payments, dodo, paddle, stripe]
---

# Subscription and billing user flow context map

## Context
Harune의 결제 코드는 여러 provider를 지원하도록 scaffold되어 있다. 기존 payment 문서는 helper와 DB schema 중심이라 사용자가 실제로 어떤 route를 지나 checkout/billing으로 이동하는지, provider별 차이가 무엇인지가 충분히 드러나지 않았다.

## Guidance
구독 시작 URL은 query parameter로 plan/provider/type을 받는다.

```text
/subscribe?codename={plan}&type={monthly|yearly|onetime}&provider={provider}
  -> auth required
  -> plan lookup by codename
  -> existing subscription check
  -> provider-specific checkout or billing portal redirect
```

주요 route는 다음과 같다.

| Route | User-facing responsibility |
|---|---|
| `/subscribe` | plan/provider/type 검증 후 checkout 시작 |
| `/subscribe/billing-form` | DodoPayments에 필요한 billing address 수집 |
| `/subscribe/paddle` | Paddle transaction id로 client checkout modal 열기 |
| `/subscribe/billing` | 기존 customer의 billing/customer portal로 redirect |
| `/subscribe/success` | provider 결과 확인 후 app 또는 billing으로 안내 |
| `/subscribe/error` | 결제 시작/전환 실패 이유와 다음 행동 안내 |

Provider별 흐름은 다음과 같다.

| Provider | Checkout behavior | Existing subscription behavior | Portal support |
|---|---|---|---|
| Stripe | Stripe Checkout Session redirect | monthly/yearly는 billing으로, onetime은 error | Stripe billing portal |
| LemonSqueezy | checkout session redirect | monthly/yearly는 billing으로, onetime은 error | TODO 상태 |
| Dodo | billing info 필요, payment link redirect | monthly/yearly는 billing으로, onetime은 error | Dodo customer portal |
| Paddle | server transaction 생성 후 `/subscribe/paddle` modal | monthly/yearly는 billing으로, onetime은 error | Paddle customer portal |

Dodo는 billing form이 중간에 들어간다.

```text
/subscribe?provider=dodo...
  -> billing query 없음
  -> /subscribe/billing-form?callbackUrl={originalSubscribeUrl}
  -> user enters country/state/city/street/zipcode/tax_id
  -> callbackUrl에 billing query 추가
  -> /subscribe?...&billing_country=...
  -> Dodo payment_link redirect
```

결제 성공 route는 provider별 검증 수준이 다르다.

```text
/subscribe/success
  -> Dodo subscription_id: retrieve subscription, require active
  -> Dodo payment_id: retrieve payment, require succeeded
  -> otherwise: SuccessRedirector
```

## Why This Matters
결제는 사용자에게 가장 민감한 흐름이다. 같은 `/subscribe` route라도 provider마다 필요한 입력, redirect 방식, portal 지원, 기존 subscription 처리 방식이 다르다. 문서에서 이 차이를 숨기면 새 provider 작업이나 billing UX 변경 중 잘못된 redirect를 만들기 쉽다.

또한 “helper가 있다”는 사실이 “사용자 흐름이 완성됐다”는 뜻은 아니다. LemonSqueezy portal은 TODO이고, credits 구매 흐름은 별도 활성화 조건이 필요하다.

## When to Apply
- plan card에서 subscribe URL을 생성하거나 바꿀 때
- Dodo billing form 필드/검증을 바꿀 때
- Paddle checkout modal 또는 transaction id 처리를 바꿀 때
- billing portal route를 확장하거나 provider 우선순위를 바꿀 때
- webhook이 user plan/customer id를 저장하는 방식을 바꿀 때

## Examples
구독 시작 실패를 디버깅할 때:

```text
1. subscribeParams가 query를 통과하는지
2. 사용자가 인증되어 있는지
3. plan.codename이 DB에 있는지
4. provider별 price/product id가 있는지
5. 기존 subscription id가 있어 billing/error로 빠지는지
6. provider checkout response에 URL 또는 transaction id가 있는지
```

Billing portal이 열리지 않을 때:

```text
1. user row에 dodoCustomerId, paddleCustomerId, stripeCustomerId 중 무엇이 있는지
2. /subscribe/billing provider 우선순위가 의도와 맞는지
3. customer portal API가 URL/link를 반환하는지
4. LemonSqueezy는 아직 TODO 상태임을 확인
```

## Related
- `docs/solutions/documentation-gaps/payments-credits-and-background-jobs-map-2026-04-28.md`
- `docs/solutions/documentation-gaps/data-model-and-migration-map-2026-04-28.md`
- `docs/solutions/documentation-gaps/developer-workflow-and-testing-map-2026-04-28.md`
