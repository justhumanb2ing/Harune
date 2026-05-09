---
title: Public website and content features context map
date: 2026-04-28
category: documentation-gaps
module: public-website
problem_type: documentation_gap
component: documentation
severity: medium
applies_when:
  - 랜딩, 공개 콘텐츠, 정책, roadmap, explore를 수정할 때
  - 현재 활성 기능과 예정/placeholder 기능을 구분해야 할 때
  - 공개 사이트 navigation과 SEO 노출 범위를 점검할 때
tags: [public-website, landing, policies, roadmap, explore, content]
---

# Public website and content features context map

## Context
Harune의 공개 웹사이트는 단순 marketing shell이 아니라 신규 가입 funnel, 정책 문서, 변경 로그, roadmap, 공개 profile page 탐색 경험의 일부를 제공한다. 기존 문서는 SEO/content 기술 경계를 설명하지만, 사용자가 보는 공개 기능의 상태와 route별 의미를 충분히 분리하지 않았다.

## Guidance
공개 웹사이트의 사용자 기능은 다음과 같이 나뉜다.

| Feature | Route | Status | Notes |
|---|---|---|---|
| Landing | `/` | active | CTA는 `/join`, 로그인은 feature flag에 따라 `/login` 노출 |
| Join shortcut | `/join` | active | 비로그인은 `/sign-up`, 로그인은 app redirect |
| Login shortcut | `/login` | active | 비로그인은 `/sign-in`, 로그인은 app redirect |
| Public profile | `/{handle}` | active | 사용자가 만든 link-in-bio page |
| Explore | `/explore` | active | 공개 profile 페이지 목록을 이름, handle, image로 탐색 |
| Roadmap | `/roadmap` | content active | `src/content/policies/roadmap.md` 기반 예정 기능 목록 |
| Changelog | `/changelog` | content active | `src/content/policies/changelog.md` 기반 공개 변경 로그 |
| Policies | `/terms`, `/privacy`, `/refund` | active | MD/MDX 정책 콘텐츠 렌더링 |

랜딩 페이지 섹션은 제품 메시지를 담당한다.

```text
src/app/(website-layout)/page.tsx
  -> MainHeroSection
  -> HandleCardSection
  -> AnalyticsCardSection
  -> LiveCardSection
  -> final Get Started CTA
```

Footer navigation은 현재 약식이다.

```text
Footer links:
  -> /
  -> /terms
  -> /privacy
  -> mailto:support
```

정책/콘텐츠 페이지는 `PolicyContentSection`과 `getPolicyBySlug`를 통해 렌더링된다.

```text
src/content/policies/{slug}.md
  -> getPolicyBySlug(slug)
  -> src/app/(website-layout)/(policies)/{slug}/page.tsx
  -> PolicyContentSection
```

## Why This Matters
공개 웹사이트 문서를 SEO나 컴포넌트 위치만으로 설명하면 제품 상태를 놓친다. 예를 들어 `/explore`는 route와 metadata만 있는 placeholder가 아니라 이제 공개 profile 목록을 보여주는 실제 탐색 페이지다. 반대로 `/roadmap`은 정책 레이아웃을 재사용하지만 사용자에게는 제품 예정 기능을 알리는 공개 페이지다.

작업 전 active 기능과 placeholder 기능을 구분해야 사용자에게 이미 제공되는 경험을 깨지 않고, 예정 기능을 실제 기능으로 전환할 때 필요한 backend/data 요구사항을 다시 볼 수 있다.

## When to Apply
- 랜딩 CTA, hero, public navigation을 바꿀 때
- roadmap/changelog/policy 콘텐츠를 추가하거나 route를 바꿀 때
- explore를 profile discovery 페이지로 유지 보수할 때
- public profile page를 공개 웹사이트 navigation과 연결할 때

## Examples
새 공개 콘텐츠 페이지를 추가할 때:

```text
1. src/content/policies/{slug}.md 작성
2. src/app/(website-layout)/(policies)/{slug}/page.tsx 추가
3. createPageMetadata path/title/description 설정
4. 필요한 경우 footer/header navigation에 링크 추가
5. sitemap/robots 노출 여부 확인
6. source test가 필요한 content route면 테스트 추가
```

Explore를 실제 기능으로 전환할 때 필요한 최소 결정:

```text
1. ranking metric: page views, clicks, CTR, manual curation 중 무엇인지
2. public exposure: 모든 profile page인지 opt-in인지
3. abuse handling: self-click, spam profile, private/suspended account 제외 여부
4. data source: Umami aggregation인지 DB snapshot인지
5. empty/loading/error states
```

## Related
- `docs/solutions/documentation-gaps/seo-content-and-media-map-2026-04-28.md`
- `docs/solutions/documentation-gaps/analytics-and-observability-map-2026-04-28.md`
- `docs/solutions/documentation-gaps/user-onboarding-and-auth-funnel-map-2026-04-28.md`
