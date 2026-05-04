---
title: Auth layout floating image showcase contract
date: 2026-05-04
category: best-practices
module: auth-layout
problem_type: interaction_contract
component: frontend
severity: medium
applies_when:
  - `(auth)` layout의 right-side showcase를 바꿀 때
  - auth surface에서 decorative image motion을 추가하거나 조정할 때
  - reduced motion, overlap, pointer interception, image sizing을 점검할 때
tags: [auth, layout, motion, image, showcase, reduced-motion]
---

# Auth layout floating image showcase contract

## Context

`src/app/(auth)/layout.tsx`의 right-side panel은 로그인/회원가입 같은 auth surface의 첫인상을 만든다. 기존 bento-style showcase를 제거하고, 두 개의 layout side PNG를 떠다니는 이미지 카드로 보여주도록 바꿨다.

이 변경은 단순 이미지 교체가 아니라 auth page의 분위기, motion timing, short viewport 안정성을 함께 결정한다.

## Locked Behavior

- Right-side panel은 `auth-bento-showcase`가 아니라 전용 floating image component를 사용한다.
- 보여주는 이미지는 다음 두 개로 고정한다.
  - `layout-side-02.PNG`
  - `layout-side-01.PNG`
- 두 이미지는 `motion/react-client` 기반으로 독립적으로 float motion을 가져야 한다.
- motion은 장식이지만 정적인 poster처럼 보이면 안 된다.
- reduced motion 사용자에게는 반복 floating 대신 정적인 카드 상태를 보여준다.
- 이미지 카드는 auth content를 가리지 않아야 하며, pointer event를 차지하지 않아야 한다.
- `xl` 이상에서만 보여주는 current layout contract는 유지한다.

## Allowed Fixes

- 이미지 카드 크기, rotation, drift range, shadow, blur, spacing을 조정한다.
- card shell과 background glow를 다듬는다.
- reduced motion에서 initial pose를 유지하되 repeat motion만 끈다.

## Implementation Notes

Floating showcase는 다음 구조를 유지한다.

```text
src/app/(auth)/layout.tsx
  -> AuthFloatingImageShowcase
      -> motion.div
      -> next/image
```

Card sizing is intentional:

- `layout-side-02.PNG` is landscape, so it uses a wider card ratio.
- `layout-side-01.PNG` is portrait, so it uses a taller card ratio.

This keeps the screenshots fully legible while the float animation runs.

## Verification Checklist

- Desktop auth layout on `xl+` shows both images.
- The cards do not clip at typical laptop heights.
- Reduced motion still renders both images without looping animation.
- Images do not intercept clicks or focus on the auth form side.

## Related

- `src/app/(auth)/layout.tsx`
- `src/components/auth/auth-floating-image-showcase.tsx`
