---
title: Analytics and observability context map
date: 2026-04-28
category: documentation-gaps
module: analytics-observability
problem_type: documentation_gap
component: documentation
severity: medium
applies_when:
  - 공개 프로필 조회수, 클릭수, CTR, 분석 화면을 수정할 때
  - Umami 또는 Betterlytics 설정을 변경할 때
  - Sentry/analytics 환경변수와 client/server 노출 경계를 확인할 때
tags: [analytics, umami, observability, profile-page, sentry]
---

# Analytics and observability context map

## Context
분석 기능은 공개 프로필 페이지의 조회와 클릭을 Umami로 수집하고, 인앱 `/analytics` 화면에서 현재 사용자의 profile page id 기준으로 요약한다. 핵심은 가변 handle이 아니라 stable `profile_page.id`를 analytics path로 쓰는 것이다.

## Guidance
수집 경로는 다음과 같다.

```text
PublicProfilePage
  -> ProfilePageAnalyticsTracker
  -> trackProfilePagePageView(profilePageId)
  -> window.umami.track(...)
  -> /_analytics/profile-page/{profilePageId}
```

클릭 수집은 anchor wrapper에서 처리한다.

```text
TrackedProfilePageLink
  -> trackProfilePageItemClick({
       itemKind: "social" | "link",
       itemLabel,
       platform?,
       href,
       profilePageId
     })
```

조회 경로는 서버 API가 맡는다.

```text
GET /api/app/analytics
  -> withAuthRequired
  -> getOwnedProfilePage(userId)
  -> getProfileAnalyticsResponse(profilePageId, timezone)
  -> Umami reporting API
```

주요 파일은 다음과 같다.

| File | Responsibility |
|---|---|
| `src/lib/analytics/profile-page.ts` | event name, analytics path, tracker 호출 |
| `src/components/analytics/profile-page-analytics-tracker.tsx` | page view dedupe와 tracked link |
| `src/lib/analytics/profile-page-summary.ts` | Today/7d/30d summary, CTR, top items |
| `src/lib/analytics/analytics-ranges.ts` | timezone-aware range 계산 |
| `src/lib/analytics/umami-client.ts` | Umami API 설정과 fetch |
| `src/app/api/app/analytics/route.ts` | 인증된 분석 API |
| `src/components/analytics/analytics-script.tsx` | 전역 analytics script 삽입 |

Metric 의미는 다음과 같다.

| Metric | Meaning |
|---|---|
| `pageViews` | `profile-page-view` 이벤트 합계 |
| `socialClicks` | `profile-social-click` 이벤트 합계 |
| `linkClicks` | `profile-link-click` 이벤트 합계 |
| `itemClicks` | social + link clicks |
| `ctr` | `itemClicks / pageViews * 100`, pageViews가 0이면 0 |

## Why This Matters
Handle은 사용자가 바꿀 수 있다. URL path를 그대로 분석 key로 쓰면 핸들 변경 후 같은 페이지의 지표가 쪼개진다. 이 프로젝트는 `/_analytics/profile-page/{profilePageId}` 형태의 synthetic path로 이 문제를 피한다.

분석 API key와 token은 서버 환경변수로만 다뤄야 한다. 클라이언트는 script source/site id 정도만 알고, reporting API 호출은 route handler에서 수행한다.

## When to Apply
- 공개 페이지 link/social anchor를 바꿀 때
- `profile_page.id`를 응답에서 제거하거나 public query shape를 바꿀 때
- Today/7d/30d range나 timezone 처리를 바꿀 때
- Umami 환경변수 이름 또는 provider 선택 로직을 바꿀 때

## Examples
핸들 변경 후에도 지표가 이어져야 하는 이유:

```text
old public URL: /old-handle
new public URL: /new-handle
analytics URL: /_analytics/profile-page/{same-profile-page-id}
```

분석 문제가 생기면 아래를 먼저 확인한다.

```text
1. 전역 Umami script가 삽입됐는지
2. window.umami가 존재하는지
3. profilePageId가 PublicProfilePage까지 전달되는지
4. synthetic analytics path가 같은지
5. server Umami API env가 있는지
6. timezone header fallback이 정상인지
```

## Related
- `docs/plans/2026-04-23-001-feat-umami-profile-analytics-plan.md`
