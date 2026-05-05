---
title: Landing card showcase sizing contract
date: 2026-05-05
category: best-practices
module: website-layout
problem_type: ui_sizing_contract
tags: [landing, showcase, motion, sizing, bento]
---

# Landing card showcase sizing contract

`src/components/website/landing/landing-card-showcase.tsx`는 landing page에서 profile bento 스타일 아이템을 개별 motion card로 보여주는 전용 surface다. 이 surface는 actual grid renderer를 쓰지 않지만, profile bento resize option과 같은 `w x h` 계약을 유지해야 한다.

## Current Contract

- landing showcase는 실제 grid footprint 계산식을 따른다.
- desktop 기준은 `columnWidth = 184px`, `rowHeight = 76px`, `margin = 32px`다.
- compact/tablet/mobile 기준은 `columnWidth = 174px`, `rowHeight = 71px`, `margin = 32px`다.
- card size는 `width = w * columnWidth + (w - 1) * margin`, `height = h * rowHeight + (h - 1) * margin`로 계산한다.
- map item은 `2x4`를 사용한다.
- media item은 `2x4` 하나와 `1x4` 하나를 사용한다.
- text item은 `1x2` 두 개를 사용하고 배경은 white로 고정한다.
- link item은 `1x2` 두 개와 `2x2` YouTube item 하나를 사용한다.
- link item은 outer padding wrapper 안에 별도 visible wrapper를 두고, 그 wrapper에 `surface-bevel`을 적용한다.
- link content padding은 bevel wrapper의 child에서 유지한다.
- YouTube favicon/icon wrapper는 bevel을 제거한다.
- 각 item은 개별 motion wrapper로 배치하고, wrapper 바깥에 grid renderer를 붙이지 않는다.
- item root는 pointer interaction을 받지 않도록 `pointer-events-none`을 유지한다.
- card body는 size wrapper를 다시 만들지 않고, outer wrapper가 실제 렌더 박스를 책임진다.

## Expected Pixel Sizes

| option | desktop | compact/tablet/mobile |
| --- | --- | --- |
| `2x2` | `400px x 184px` | `380px x 174px` |
| `2x4` | `400px x 400px` | `380px x 380px` |
| `1x2` | `184px x 184px` | `174px x 174px` |
| `1x4` | `184px x 400px` | `174px x 380px` |

## Maintenance Notes

- size 계산을 수정할 때는 desktop/compact 둘 다 동시에 확인한다.
- link provider theme, favicon, bevel, shadow는 size contract와 별개로 유지한다.
- absolute placement을 바꿔도 width/height 계산식은 변하지 않아야 한다.
