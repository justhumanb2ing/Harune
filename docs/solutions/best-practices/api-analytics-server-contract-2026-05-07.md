---
title: API analytics server contract
date: 2026-05-07
category: best-practices
module: api-architecture
problem_type: best_practice
component: api
severity: medium
applies_when:
  - `/api/analytics` legacy alias를 서버 레포의 `/me/analytics`로 옮겨 구현할 때
  - owner-only analytics summary를 proxy 또는 gateway 뒤로 분리할 때
  - timezone, ownership, no-profile, disabled 분기를 서버 계약으로 고정할 때
tags: [api, analytics, server, auth, proxy, timezone]
---

# API analytics server contract

## Context

`/me/analytics`는 공개 analytics 페이지가 아니라 로그인한 owner의 profile page analytics 요약을 내려주는 서버 계약이다.

다른 서버 레포에서 구현할 때는 아래 두 경계를 분리해서 생각해야 한다.

- 프론트/앱이 호출하는 legacy alias: `/api/analytics`
- 서버 레포의 canonical owner analytics endpoint: `/me/analytics`

프론트가 계속 `/api/analytics`를 호출하더라도, 실제 데이터 계산과 ownership 판정은 서버 레포에서 `/me/analytics` 계약으로 처리하고 proxy/gateway가 그쪽으로 전달하는 구성이 가장 단순하다.

## What It Is For

이 endpoint는 아래 목적에만 사용한다.

- 로그인한 사용자의 owned profile page analytics를 한 번에 읽기
- `today`, `7d`, `30d` 범위 요약을 함께 내려주기
- timezone을 반영한 range 계산을 서버에서 일관되게 유지하기
- analytics UI의 initial fetch와 refetch를 위한 단일 JSON DTO 제공하기

## What It Is Not For

이 endpoint는 아래 용도가 아니다.

- public profile page의 page view 수집
- visitor용 공개 analytics 조회
- client가 임의로 다른 `profilePageId`를 주입하는 read API
- session 없는 anonymous 조회

analytics 수집은 별도의 tracking path가 맡고, 이 endpoint는 조회 요약만 맡는다.

## Request Contract

권장 method와 입력은 다음과 같다.

```http
GET /me/analytics
```

필수/선택 입력:

- authentication: required
- request body: none
- `x-vercel-ip-timezone`: optional

timezone header가 없거나 유효하지 않으면 `UTC`로 normalize한다.

## Response Contract

성공 응답은 아래 union을 유지한다.

```ts
type ProfileAnalyticsResponse =
  | {
      profilePageId: null;
      state: "disabled";
      summaries: ProfileAnalyticsSummaryMap;
      timezone: string;
    }
  | {
      profilePageId: null;
      state: "no-profile";
      summaries: ProfileAnalyticsSummaryMap;
      timezone: string;
    }
  | {
      profilePageId: string;
      state: "ready";
      summaries: ProfileAnalyticsSummaryMap;
      timezone: string;
    };
```

### State semantics

- `ready`: owned profile page가 있고 analytics provider도 사용 가능하다.
- `no-profile`: 로그인은 되었지만 owned profile page가 없다.
- `disabled`: owned profile page는 있지만 analytics provider/reporting config가 비활성이다.

### Summary shape

`summaries`는 항상 아래 키를 가진다.

```ts
{
  today: ProfileAnalyticsSummary;
  "7d": ProfileAnalyticsSummary;
  "30d": ProfileAnalyticsSummary;
}
```

각 summary는 다음을 포함한다.

- range window 정보
- `pageViews`
- `socialClicks`
- `linkClicks`
- `itemClicks`
- `ctr`
- previous period totals
- metric changes
- time series points
- top clicked items

## Behavior Rules

서버 레포에서는 아래 순서를 지킨다.

```text
1. auth/session 확인
2. 현재 user의 owned profile page lookup
3. timezone normalize
4. analytics provider available 여부 확인
5. summary map 생성
6. JSON response 반환
```

권장 규칙:

- `profilePageId`는 session user의 owned page에서만 찾는다.
- client가 보낸 profilePageId를 신뢰하지 않는다.
- timezone 계산은 request header가 아니라 normalize된 server value를 기준으로 한다.
- `ctr`는 `itemClicks / pageViews * 100`을 whole number로 반올림한다.
- `pageViews`가 0이면 `ctr`는 0이다.
- `today`와 `7d`/`30d`는 각각 독립적인 summary key로 유지한다.

## Error Contract

실패 응답은 최대한 단순하게 유지한다.

- 인증 실패: `401` with existing unauthorized JSON contract
- 예기치 않은 server error: `500` with `{ error: "Failed to load profile analytics." }`

에러 shape를 바꿀 때는 프론트 query client의 error parsing도 같이 맞춰야 한다.

## Implementation Boundary

서버 레포의 구현 경계는 아래처럼 두는 것이 안전하다.

```text
route
  -> auth/session middleware
  -> service
  -> repository / reporting client
```

주의할 점:

- route handler 안에서 DB aggregation을 직접 하지 않는다.
- transaction-local snapshot을 성공 응답으로 반환하지 않는다.
- analytics query는 current user ownership을 기준으로 한 번만 계산한다.
- public profile route와 analytics route를 섞지 않는다.

## Analytics Path Contract

analytics 집계가 Umami나 유사 reporting store를 사용한다면, synthetic path는 handle이 아니라 stable profile page id를 써야 한다.

```text
/_analytics/profile/{profilePageId}
```

핸들은 바뀔 수 있지만 profile page id는 stable해야 한다.  
이 규칙을 지키지 않으면 같은 페이지의 누적 지표가 handle 변경 뒤에 쪼개진다.

## Minimal Server Checklist

다른 서버 레포에서 바로 구현하려면 아래만 맞추면 된다.

```text
1. GET /me/analytics route
2. auth/session guard
3. x-vercel-ip-timezone normalize
4. owned profile page lookup
5. disabled / no-profile / ready 분기
6. ProfileAnalyticsResponse JSON shape
7. 401 and 500 error contract
8. synthetic analytics path uses profilePageId
9. focused tests for auth, timezone, state branches
```

## Suggested Tests

권장 테스트는 아래 5개다.

- session이 없으면 401을 반환하는지
- timezone header가 정상적으로 전달되고 normalize 되는지
- profile page가 없을 때 `state: "no-profile"`을 반환하는지
- analytics provider가 꺼져 있을 때 `state: "disabled"`를 반환하는지
- ready 상태에서 summary map이 `today`, `7d`, `30d`를 모두 포함하는지

## Related

- `docs/solutions/documentation-gaps/analytics-and-observability-map-2026-04-28.md`
- `docs/solutions/best-practices/hono-next-api-boundary-2026-05-03.md`
- `docs/solutions/best-practices/api-me-app-context-contract-2026-05-07.md`
