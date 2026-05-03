---
title: Profile bento v2 user experience contract
date: 2026-05-03
category: best-practices
module: profile-page
problem_type: user_experience_contract
component: frontend
severity: medium
applies_when:
  - `/[handle]` owner editor의 item 추가, 삭제, focus, scroll, motion 동작을 수정할 때
  - profile bento editor와 readonly public surface의 UI/UX parity를 바꿀 때
  - 사용자 체감 동작이 "동작은 하지만 어색한" 상태를 고칠 때
tags: [profile-page, bento, ux, scroll, focus, motion, editor]
---

# Profile bento v2 user experience contract

## Context

`/[handle]` profile bento v2는 public page와 owner editor가 거의 같은 visual surface를 공유한다. 따라서 UI/UX 수정은 단순 스타일 변경이 아니라 editor flow, public parity, motion, focus, pointer interaction이 함께 맞아야 한다.

이 문서는 작은 UX 개선이 같은 문제를 다시 만들지 않도록 보존해야 하는 체감 동작을 기록한다.

## Current Contract

### Add Item Scroll

Owner editor에서 새 item을 추가하면 사용자가 그 item이 생긴 위치를 바로 인지할 수 있어야 한다.

- 일반 item 추가, link crawl placeholder 추가, media upload placeholder 추가는 모두 새 item 위치로 이동해야 한다.
- 이동은 instant jump가 아니라 smooth scroll이어야 한다.
- `scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" })`는 item 위치 이동의 기본 contract다.
- 새 item 내부 입력 필드에 focus가 필요하면 `focus({ preventScroll: true })`를 사용한다.
- `focus()`가 브라우저 기본 instant scroll을 먼저 발생시키면 smooth scroll 체감이 사라진다.
- text item과 section item처럼 추가 직후 autofocus가 있는 surface는 focus와 scroll 책임을 분리해야 한다.

현재 관련 흐름:

```text
ProfileBentoInteractiveGrid.addItem()
  -> setPendingScrollItemId(nextItem.id)
  -> requestAnimationFrame retry
  -> item.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" })

EditableTextBento / EditableSectionBento
  -> focus({ preventScroll: true })
  -> setSelectionRange(...)
```

### Editor Focus

편집 가능한 item은 추가 직후 바로 입력할 수 있어야 한다. 다만 focus는 viewport 이동을 담당하지 않는다.

- text item과 section item은 추가 직후 입력 커서를 끝 위치에 둔다.
- focus는 item 추가 scroll을 덮어쓰지 않아야 한다.
- focus side effect를 수정할 때는 keyboard 사용성과 screen reader focus 이동을 같이 확인한다.

### Public/Edit Parity

Public readonly surface와 owner editor surface는 의도적으로 같은 profile presentation을 보여준다.

- read-only라고 해서 card radius, padding, shadow, media crop, link provider theme를 다르게 만들지 않는다.
- 일반 item의 card outline은 콘텐츠보다 앞서 보이지 않도록 옅게 유지하고, section item은 outline 없이 얇은 구분선 텍스트처럼 보여야 한다.
- owner-only controls, input affordance, upload/loading state만 editor 전용으로 둔다.
- public surface에서 삭제된 fallback text는 editor에도 무심코 되살리지 않는다.

### Motion And Pointer Feel

Motion은 장식이 아니라 item 위치, drag affordance, public reveal 순서를 이해하게 만드는 피드백이다.

- item 추가/진입 motion은 scroll 위치 이동과 충돌하지 않아야 한다.
- drag motion을 고칠 때는 `docs/solutions/best-practices/profile-bento-v2-drag-motion-and-section-shadow-contract-2026-05-01.md`를 함께 확인한다.
- `prefers-reduced-motion` 사용자는 과한 motion 없이 같은 정보 구조를 이해할 수 있어야 한다.
- hover/focus/drag 상태는 pointer interception과 text selection 부작용을 실제로 확인한다.

### Link Media Fallback

Link item의 thumbnail과 favicon 영역은 이미지 유무와 관계없이 같은 layout footprint를 유지해야 한다. 이미지가 없을 때도 영역은 남기되 skeleton처럼 옅은 회색 배경으로 비어 있는 media slot임을 드러낸다.

- thumbnail이 없으면 `bg-muted/60` 수준의 희미한 배경으로 렌더링해 로딩 skeleton과 비슷하게 처리한다.
- favicon이 없으면 작은 점이나 임의 아이콘을 만들지 않고 같은 크기의 옅은 회색 square placeholder를 유지한다.
- thumbnail wrapper와 내부 image는 `pointer-events: none`을 유지한다.
- thumbnail 영역이 pointer event를 받으면 grid item drag/resize 시작점과 충돌할 수 있다.
- 2x1, 2x2, 2x4, 1x4 link item에서 thumbnail/favicon이 있는 경우와 없는 경우 모두 editor/public visual parity와 resize control이 끊기지 않아야 한다.

### Public Render Performance

공개 profile 접근은 링크 공유, 검색, 소셜 인앱 브라우저에서 가장 먼저 체감되는 surface다. 따라서 public readonly route는 아래 contract를 유지한다.

- public readonly grid는 `react-grid-layout`이 계산하는 compact/desktop 좌표, rowHeight, section height, card wrapper를 기준으로 editor와 같은 visual contract를 유지한다. CSS grid로 대체하면 저장된 layout semantics와 short viewport parity가 깨질 수 있다.
- owner가 자신의 공개 페이지에 접근할 때 readonly surface가 먼저 보인 뒤 editor로 깜빡이며 바뀌면 안 된다. owner 여부는 서버 렌더 전에 결정하고, owner면 첫 HTML부터 editor surface만 렌더한다.
- anonymous public route는 `auth()`를 호출하지 않는다. session cookie signal이 있을 때만 owner 확인용 auth/editor read를 수행한다.
- public profile data는 짧은 revalidate cache를 사용하고, profile sync API는 cache tag와 path를 함께 무효화한다.
- playlist iframe은 저장된 embed HTML에 `loading` attribute가 없어도 기본 lazy loading을 적용한다.
- media video는 public initial load에서 metadata/body fetch를 강제하지 않도록 `preload="none"`을 기본으로 둔다.

## Update Rule

UI/UX 개선을 적용했을 때 아래 중 하나라도 해당하면 이 문서를 같은 변경 단위에서 갱신한다.

- 사용자가 체감 품질을 기준으로 지적한 문제를 해결했다.
- smoothness, focus, scroll, hover, drag, reveal, loading, toast, empty state, mobile ergonomics 중 하나의 contract가 새로 생겼다.
- public surface와 editor surface의 parity 기준이 바뀌었다.
- 구현상으로는 작은 변경이지만 다시 깨지면 사용자가 바로 체감할 가능성이 높다.

기록할 때는 구현 파일명만 쓰지 말고 다음을 함께 남긴다.

- 사용자가 기대하는 체감 동작
- 브라우저/React/라이브러리 기본 동작과 충돌한 원인
- 유지해야 하는 코드 contract
- 확인해야 하는 viewport 또는 interaction

## Verification Checklist

UI/UX 변경 후 가능한 범위에서 아래를 확인한다.

- Desktop과 mobile 폭에서 text가 겹치거나 버튼 안에서 잘리지 않는다.
- 추가, 삭제, drag, focus, save 같은 주요 flow가 layout shift 없이 이어진다.
- hover-only controls는 keyboard focus로도 접근 가능하다.
- scroll/focus 변경은 autofocus, fixed footer toolbar, nested scroll container와 충돌하지 않는다.
- public readonly page와 owner editor가 의도한 차이만 갖는다.

## Related

- `docs/solutions/best-practices/profile-bento-v2-drag-motion-and-section-shadow-contract-2026-05-01.md`
- `docs/solutions/documentation-gaps/frontend-ui-composition-map-2026-04-28.md`
- `docs/solutions/documentation-gaps/profile-page-domain-map-2026-04-28.md`
