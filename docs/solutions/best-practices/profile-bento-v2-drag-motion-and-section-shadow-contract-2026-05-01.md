---
title: Profile bento drag motion and section shadow contract
date: 2026-05-01
category: best-practices
module: profile-page
problem_type: interaction_contract
component: frontend
severity: high
applies_when:
  - `/[handle]` bento grid drag interaction을 수정할 때
  - section item의 visual height, shadow, hover, focus 상태를 수정할 때
  - drag 중 input/textarea hover, selection, action UI 노출 문제를 수정할 때
tags: [profile-page, bento, drag-motion, section, shadow, react-grid-layout]
---

# Profile bento drag motion and section shadow contract

## Context

`/[handle]` owner editor의 bento grid는 velocity 기반 drag motion을 사용한다. 사용자가 item을 좌우로 흔들며 drag할 때 item이 pointer velocity에 반응해 rotate/x motion을 보여야 한다.

Section item은 React Grid Layout 상으로는 h=2 영역을 예약하지만, 시각적으로는 h=1 높이만 보인다. 이 item의 shadow는 보이는 h=1 item body에만 적용되어야 한다.

## Locked Behavior

이 동작은 의도된 interaction contract다. 관련 문제를 고칠 때 아래 항목을 제거하거나 약화하면 안 된다.

- Drag 중 velocity motion은 유지한다.
- `useGridDragMotion`의 `cardRotate`와 `cardX`는 실제 editor item body에 연결되어야 한다.
- `/[handle]` owner editor에서 실제 렌더링되는 item shell은 `motion.div`여야 한다.
- Drag 중 active item은 `rotate: cardRotate`, `x: cardX`를 적용해야 한다.
- Drag 중 active item wrapper에는 별도 `drop-shadow-*` filter를 붙이지 않는다.
- Section item은 hover, 내부 input focus, drag 상태에서 `shadow-float`를 표시해야 한다.
- Section item의 `shadow-float`는 h=2 RGL wrapper가 아니라 h=1로 보이는 item body에 적용해야 한다.

## Allowed Fixes

Drag motion 때문에 pointer가 내부 input/textarea를 스치면서 생기는 부작용은 motion을 제거하지 않고 해결한다.

허용되는 해결 범위:

- Drag 중인 item 내부 input/textarea의 pointer hit-test를 잠시 끈다.
- Drag 중인 item 내부 input/textarea의 hover/focus background를 투명하게 고정한다.
- Drag 중인 item 내부 input/textarea의 text selection을 잠시 끈다.
- Grid가 drag 중인 동안 grid 내부 모든 input/textarea의 pointer hit-test를 잠시 끈다.
- Grid가 drag 중인 동안 grid 내부 모든 input/textarea의 selection highlight를 투명하게 처리한다.
- Drag 중인 item에서는 Remove button과 resize controls를 숨긴다.

금지되는 해결:

- velocity spring 값을 제거하거나 0으로 고정한다.
- `cardRotate`/`cardX` 연결을 끊는다.
- `motion.div`를 일반 `div`로 되돌린다.
- section item의 input focus shadow를 제거한다.
- section item shadow를 h=2 wrapper에 붙인다.

## Implementation Notes

현재 `/[handle]` owner editor의 실제 drag item body는 `ProfileBentoInteractiveGrid` 내부의 `ProfileBentoGridShell`이다.

이 파일에서 velocity motion과 section shadow contract를 유지해야 한다.

```tsx
<motion.div
  style={{
    rotate: isDragActive ? cardRotate : 0,
    x: isDragActive ? cardX : 0,
    transformOrigin: "50% 70%",
  }}
>
```

Section shadow 조건은 hover, focus, drag를 모두 포함해야 한다.

```ts
const shouldShowSectionShadow =
  isSectionItem && (isSectionPointerActive || isSectionFocusActive || isDragActive);
```

Drag 부작용을 고칠 때는 위 contract를 보존한 상태에서 drag-active class와 action UI visibility만 조정한다.

## Selection Bug Root Cause

Drag 중 input/textarea에 파란 selection highlight가 생기는 문제는 일반 document text selection이 아니다.

특히 section item title은 실제 `input`이다. input/textarea는 `window.getSelection()`이 아니라 element 자체의 `selectionStart`/`selectionEnd`와 native `::selection` 렌더링을 가진다. 따라서 다음 접근만으로는 부족하다.

- `window.getSelection()?.removeAllRanges()`
- dragged item에만 `user-select: none`
- dragged item 내부 active input만 selection range collapse

React Grid Layout drag 중에는 pointer가 active item뿐 아니라 다른 grid item 위도 지나간다. 그 다른 item 안의 input/textarea도 native selection target이 될 수 있다. 그래서 drag 중인 item 하나만 막으면 다른 item에서 selection highlight가 계속 생길 수 있다.

## Required Selection Fix

Grid drag가 시작되면 root grid wrapper에 `profile-bento-grid-dragging` class를 붙인다. 이 class는 active item이 아니라 grid 전체의 editable surface를 잠그는 용도다.

```tsx
const gridClassName = `... ${activeDragItemId ? "profile-bento-grid-dragging" : ""} ...`;
```

CSS에서는 drag 중 grid 내부 모든 input/textarea에 대해 pointer hit-test, caret, selection highlight, hover/focus background를 막는다.

```css
.profile-bento-grid-dragging input,
.profile-bento-grid-dragging textarea {
  pointer-events: none;
  caret-color: transparent;
  background-color: transparent;
  -webkit-user-select: none;
  user-select: none;
}

.profile-bento-grid-dragging input:hover,
.profile-bento-grid-dragging textarea:hover,
.profile-bento-grid-dragging input:focus-visible,
.profile-bento-grid-dragging textarea:focus-visible {
  background-color: transparent;
}

.profile-bento-grid-dragging input::selection,
.profile-bento-grid-dragging textarea::selection {
  background: transparent;
  color: inherit;
}
```

JS에서는 active item 내부 editable selection range를 drag 중 계속 collapse할 수 있다. 다만 이것은 보조 장치다. 핵심은 grid 전체 dragging class로 active item 외부 editable까지 막는 것이다.
