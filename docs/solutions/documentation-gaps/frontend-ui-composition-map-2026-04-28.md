---
title: Frontend UI composition context map
date: 2026-04-28
category: documentation-gaps
module: frontend-ui
problem_type: documentation_gap
component: documentation
severity: medium
applies_when:
  - 새 UI, 화면, 공용 컴포넌트, profile editor surface를 추가할 때
  - UI 파일을 어느 폴더에 둘지 결정할 때
  - 기존 디자인/상태 관리 패턴을 따라야 할 때
tags: [frontend, ui, components, profile-editor, composition]
---

# Frontend UI composition context map

## Context
UI는 공용 primitive, 제품 섹션, profile-page 전용 컴포넌트가 섞여 있다. 새 컴포넌트를 추가할 때 위치를 잘못 잡으면 도메인 컴포넌트가 공용 UI로 새거나, 공용 primitive가 특정 화면 상태를 알게 된다.

## Guidance
컴포넌트 위치는 책임 기준으로 나눈다.

| Path | Use for | Avoid |
|---|---|---|
| `src/components/ui` | button, dialog, table, drawer, input 같은 공용 primitive | 특정 도메인 데이터 fetch |
| `src/components/layout` | header/footer/sidebar/table state 같은 레이아웃 부품 | profile-page 전용 편집 규칙 |
| `src/components/sections` | 랜딩/정책/마케팅 페이지 섹션 | 인앱 product workflow |
| `src/components/profile-page` | profile editor, public bento renderer, owner controls | 다른 도메인에서 재사용할 generic UI |
| `src/components/auth` | sign-in/sign-up/onboarding UI | 인증 외 도메인 |
| `src/components/analytics` | analytics tracking and summary UI | profile editor state |
| `src/components/icon` | product/social icon mapping | 버튼/레이아웃 로직 |

Profile editor UI는 다음 계층으로 이해한다.

```text
profile-page-editor-provider
  -> external store with selectors
  -> use-profile-page-editor hook
  -> bento editor components
  -> public bento renderer
```

상태 책임은 아래처럼 분리한다.

| State | Owner | Notes |
|---|---|---|
| persisted server snapshot | TanStack Query `profilePageQueryOptions()` | sync 성공 후 rebase 기준 |
| editable draft | profile page editor store | route 간 공유 |
| pending local file | editor store ephemeral fields | 서버 직렬화 대상 아님 |
| authenticated user shell | `useUser()` / `meQueryOptions()` | owner controls/profile fallback |

## Why This Matters
Profile editor는 입력 즉시 DB에 쓰지 않는다. UI 컴포넌트가 React Query cache를 직접 draft처럼 바꾸거나, 개별 field mutation을 되살리면 현재 sync 모델과 충돌한다.

또한 공개 profile renderer와 owner editor는 목적이 다르다. Public renderer는 실제 링크 클릭/analytics/공개 동작을 포함하고, owner editor는 편집 중 상태와 sync에 집중한다.

## When to Apply
- `src/components/profile-page/*`에서 draft 또는 public profile 동작을 바꿀 때
- 랜딩 섹션과 인앱 UI 중 어디에 컴포넌트를 둬야 할지 애매할 때
- 공용 UI primitive에 도메인 props를 넣고 싶어질 때
- social platform, icon, link renderer를 바꿀 때

## Examples
새 profile-page 편집 패널을 추가할 때 기본 읽기 순서:

```text
1. profile-page-editor-store.ts
2. use-profile-page-editor.ts
3. 기존 profile-bento-* 컴포넌트
4. profile-bento-readonly-grid.tsx
5. lib/profile-page/types.ts
6. lib/validations/profile-page.schema.ts
```

공용 버튼 스타일 변경은 `src/components/ui/button.tsx`에서 처리하고, profile editor의 저장 가능 여부 같은 도메인 조건은 hook/store에 둔다.

## Related
- `docs/solutions/documentation-gaps/profile-page-domain-map-2026-04-28.md`
- `docs/plans/2026-04-22-001-feat-profile-page-draft-sync-plan.md`
