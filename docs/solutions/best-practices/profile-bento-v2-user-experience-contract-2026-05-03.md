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
- link item의 favicon wrapper, title density, provider action chip은 editor와 readonly에서 같은 모서리, 높이, 폰트 밀도를 유지한다.
- `medium`, `threads`, `tiktok`, `chzzk` link item은 provider theme 배경을 white로 유지한다.
- 일반 item의 card outline은 콘텐츠보다 앞서 보이지 않도록 옅게 유지하고, section item은 outline 없이 얇은 구분선 텍스트처럼 보여야 한다.
- owner-only controls, input affordance, upload/loading state만 editor 전용으로 둔다.
- media/map 외부 링크 action의 size, position, icon weight, contrast는 editor와 readonly에서 같아야 한다.
- media/map full-bleed editor cards는 shell shadow를 유지한 채 visible frame에 `ring-1 ring-border`를 적용해, 카드 가장자리가 평평하게 보이지 않게 한다.
- public surface에서 삭제된 fallback text는 editor에도 무심코 되살리지 않는다.
- mobile/tablet compact column에서는 profile shell과 bento shell이 같은 compact width contract를 공유해야 한다.
- public readonly `/[handle]`에서는 viewport를 줄였다가 다시 넓혔을 때 profile shell과 bento shell이 서로 다른 breakpoint로 먼저 갈라지지 않아야 한다.
- desktop 복귀 시 readonly bento grid는 owner editor의 `2xl` desktop-flow 전환과 같은 타이밍에 4열 layout으로 돌아와야 한다.
- compact editor preview는 profile shell과 grid shell을 가운데로 다시 밀지 말고, 같은 left edge 기준으로 쌓이게 유지한다.
- public readonly surface의 compact 구간은 editor처럼 중앙 폭이 잡혀야 하고, profile shell과 bento shell은 같은 양쪽 여백 안에서 측정되어야 한다.
- public readonly page shell에서 grid resize transition을 `overflow-x-clip`/`overflow-hidden`으로 자르지 않는다. compact 전환 시 grid canvas width를 editor처럼 먼저 compact target으로 제한해 horizontal overflow 자체를 줄인다.

### Text Surface Style

Text item은 content만이 아니라 surface style도 함께 저장하고, editor와 public/landing preview가 같은 style contract를 따라야 한다.

- text item의 `content.style`는 `backgroundColor`, `textAlign`, `verticalAlign`을 포함해야 한다.
- text item의 `content.url`이 있으면 owner editor의 ellipsis popover에서 색상 아이콘 옆 링크 버튼으로 편집할 수 있어야 하고, public/landing surface는 같은 text surface를 anchor로 렌더링해야 한다.
- owner editor의 ellipsis/link popover panel은 portal로 렌더링되어도 grid drag cancel target이어야 한다. 패널, 내부 input, composite controls에서 pointer를 누른 채 움직이거나 텍스트를 selection해도 parent grid item의 press intent, `whileTap`, drag로 이어지면 안 된다.
- editor의 resize control은 단순한 preview가 아니라 실제 text item state를 갱신해야 한다.
- `backgroundColor`는 text card shell 배경에 적용하고, `textAlign`은 텍스트 블록 정렬에 적용하고, `verticalAlign`은 텍스트 surface wrapper 정렬에 적용한다.
- style 값이 비어 있거나 옛 데이터로 누락되면 `#ffffff`, `start`, `start`를 기본값으로 복원한다.
- readonly/public/landing surface는 editor와 같은 style 해석을 써야 하며, 다른 surface에서만 보이는 별도 폴백 규칙을 만들지 않는다.

### Clock Widget

Clock widget은 사용자가 추가 직후 바로 “시간 카드”로 인식할 수 있어야 하고, background color 변경과 size 조절이 다른 카드와 충돌하지 않아야 한다.

- widget dialog의 `Clock` 항목을 누르면 clock bento가 grid에 즉시 추가되어야 한다.
- widget dialog의 `Clock` 항목을 누른 뒤에는 사용자가 추가된 grid item을 바로 볼 수 있도록 dialog가 닫혀야 한다.
- clock bento는 초까지 보이도록 `showSeconds`를 기본 활성화하고, 날짜는 좌측 하단, timezone 문자열은 우측 하단에 `justify-between`으로 배치한다.
- clock bento의 날짜는 `May 18, 2026`처럼 영문 long month, day, year 순서로 표시한다.
- clock bento는 저장된 `showSeconds`가 누락되었거나 false인 옛 데이터도 초 표시를 기본값으로 복원해 실제 전자시계처럼 매초 갱신되어야 한다.
- clock bento의 시간 텍스트는 초까지 보이는 `HH:mm:ss` 길이를 compact width에서도 잘리지 않게 유지해야 한다.
- clock bento의 resize option은 3번째 preset인 `2x2`와 5번째 preset인 `2x4`만 보여야 하며, 추가 직후 기본 크기는 `2x2`여야 한다.
- clock bento의 background color는 editor surface에서 palette로 바꿀 수 있어야 하고, `content.style.backgroundColor` 저장 payload에도 그대로 반영되어야 한다. `bg-white`일 때는 text item과 동일하게 `surface-bevel`을 적용하지 않는다.
- clock bento의 timezone은 owner editor resize control에 주입된 `Select`로 바꿀 수 있어야 하고, 선택값은 저장 payload의 `content.timezone`에 반영되어야 한다. timezone 선택 후에는 select popup이 닫혀야 한다.
- clock bento의 timezone select popup에서 item을 눌러도 grid card의 drag intent나 press scale 상태가 켜지면 안 되며, hover 시 resize/background controls가 그대로 다시 보여야 한다.
- clock bento의 기본 timezone은 추가 당시의 로컬 timezone을 따라야 하며, 저장 후에는 persisted timezone을 우선한다.
- clock bento의 public/edit surface는 같은 layout와 typography contract를 공유해야 한다.

### Toolbar Primary Action

Owner editor의 하단 primary button은 현재 상태를 바로 드러내야 한다.

- 변경 사항이 없으면 `Copy my page`를 보여주고, 클릭하면 현재 public page URL을 복사한다.
- 복사에 성공하면 토스트 대신 버튼 안에서 `CheckIcon + Copied` 상태를 짧게 보여준다.
- 변경 사항이 있으면 `Save`를 보여주고, sync가 진행 중이면 `Saving`을 보여준다.
- label만 바꾸지 말고 click behavior도 상태에 맞춰 함께 전환한다.

### Editor Preview Toggle

Owner editor의 desktop/mobile preview 토글은 선택 상태와 hover affordance가 즉시 읽혀야 한다.

- preview 토글은 단일 선택 `ToggleGroup`이어야 하고, 기본 선택은 desktop이다.
- preview 토글은 profile editor와 grid를 함께 포함한 상단 전체 레이아웃을 실제로 바꿔야 한다.
- mobile 모드에서는 profile editor와 grid가 화면 정중앙의 compact column으로 모여야 한다.
- mobile 모드의 compact surface는 외부 border, `shadow-float`, `rounded-[2.5rem]`를 가져야 한다.
- compact surface는 내부 padding이 아니라 외부 margin으로 위아래 여백을 확보해야 한다.
- compact surface는 내부 콘텐츠 폭을 실제 mobile/tablet layout과 맞춰야 하며, profile shell과 grid shell은 desktop preview frame보다 좁은 mobile density를 유지해야 한다.
- compact surface 내부의 avatar, typography, spacing은 실제 mobile viewport에서 보이는 density를 따라야 하며, desktop viewport의 `xl` 확대 규칙을 그대로 쓰지 않아야 한다.
- compact 모드에서는 브라우저 최상위가 아니라 compact surface 내부에만 vertical scroll이 생겨야 하고, compact surface 높이는 preview toolbar / grid actions 위에서 끝나야 한다.
- compact 모드의 scrollbar는 보여주지 않고, 스크롤은 내부 surface에서만 동작해야 한다.
- compact preview에서는 hover / focus overlay가 x축 overflow에 의해 잘리지 않아야 한다.
- compact 모드에서 footer action은 viewport에 고정되어 page height를 늘리지 않아야 한다.
- compact surface의 외형 폭은 480px까지 늘릴 수 있지만, 내부 profile avatar/text/grid density는 기존 compact density를 유지해야 한다.
- compact 전용 scroll wrapper는 desktop surface에 섞이지 않아야 하고, desktop preview는 기존 flex-row layout을 그대로 유지해야 한다.
- browser viewport가 desktop 이하로 줄어들면 preview state를 강제로 compact로 바꾸지 말고, 기존 responsive mobile/tablet layout만 보여야 한다.
- editor preview mode는 grid 컴포넌트를 언마운트해서 바꾸지 않는다. desktop/compact 전환은 같은 grid state를 유지한 채 `desktop=860px`, `compact=400px` canvas width를 명시적으로 넘겨야 하며, 전환 애니메이션이나 브라우저 resize 중간 측정값으로 `rowHeight`를 다시 계산하지 않는다.
- desktop/mobile preview toggle group은 desktop viewport에서만 보여야 한다.
- desktop/mobile 전환은 width가 부드럽게 줄고 늘어나는 layout transition이어야 하고, 체감이 급하게 끊기지 않도록 약간 느린 duration을 유지해야 한다.
- 선택된 토글 아이템은 검은색 배경과 흰색 아이콘으로 드러나야 한다.
- 선택되지 않은 토글 아이템은 배경색이 없어야 하며, hover도 배경을 추가하지 않아야 한다.
- 각 토글 아이템은 tooltip을 가져야 하고, pointer hover와 keyboard focus에서 같은 label을 보여줘야 한다.

### Profile Image Crop Surface

Owner editor의 profile image crop은 dialog가 아니라 avatar 슬롯 위에 뜨는 inline surface여야 한다.

- crop icon을 누르면 현재 profile image를 기준으로 crop surface가 avatar 주변에 나타나야 한다.
- crop surface는 저장된 `croppedAreaPixels`를 다시 읽어서 초기 위치와 zoom을 복원해야 한다.
- crop surface를 다시 열었을 때는 이미 렌더된 profile image source를 재사용해야 하며, 불필요한 재조회 때문에 표시가 늦어지면 안 된다.
- landscape 이미지면 crop area는 원형을 유지한 채 가로로 확장된 panel 안에 들어가고, portrait 이미지면 세로로 확장된 panel 안에 들어가야 한다.
- 확장되는 panel은 layout flow를 건드리면 안 되며 `absolute` 레이어로 다른 컴포넌트와 분리되어야 한다.
- `Apply` 버튼은 cropper panel의 우상단에 걸쳐 있어야 하고, crop metadata를 확정하는 단일 진입점이어야 한다.
- crop icon 버튼과 `Apply`/`Cancel` 버튼은 container edge가 아니라 crop area 기준으로 고정되어야 하며, 이미지 aspect가 바뀌어도 위치가 흔들리면 안 된다.
- `Apply` 후에는 `imageCrop` dirty state가 생겨서 primary `Save` 버튼이 활성화되어야 한다.
- 실제 save payload에는 원본 `image` URL을 유지하고, `imageCrop`만 JSON 형태로 함께 저장해야 한다.
- public readonly avatar와 owner editor avatar는 저장된 `imageCrop`를 반영해 같은 잘림 결과를 보여야 한다.
- crop preview blob은 preload와 같은 resolved image source에서 생성해야 하며, 외부 origin 이미지도 proxy-aware source로 처리해야 한다.
- Apply 직후 avatar는 이전 원본으로 잠깐 되돌아가면 안 되고, cropped preview가 유지된 상태로 교체되어야 한다.
- crop surface를 닫는 동작은 apply와 분리되어야 하며, 닫기만 했을 때는 저장 대상이 바뀌지 않아야 한다.
- crop surface는 `overflow-hidden` ancestor에 잘리지 않도록 absolute 위치 기준을 명확히 잡아야 한다.

### Viewport-Driven Layout Sync

브라우저 폭만 바뀌었을 때는 저장 대상이 바뀐 것이 아니다. 반응형 grid가 breakpoint 전환 과정에서 layout을 다시 정렬하더라도, 그 자체를 편집 dirty state로 취급하지 않아야 한다.

- mobile, tablet, desktop 폭 전환만으로 primary button이 `Save`로 바뀌면 안 된다.
- `react-grid-layout`의 responsive `onLayoutChange`는 breakpoint crossing 시에도 호출될 수 있으므로, width-only reflow는 user edit과 분리한다.
- dirty state는 명시적인 item 추가, 삭제, drag, resize, text edit, media/link 편집으로만 변해야 한다.
- viewport-driven layout rewrite를 저장 payload나 snapshot 비교에 그대로 넣지 않는다.
- breakpoint 전환 직후에는 canonical layout을 유지하고, 편집으로 인한 layout 변경만 dirty 판정에 반영한다.
- 사용자가 실제로 위치를 옮기거나 크기를 바꾼 경우에만 `Save`가 보여야 한다.

### Owner Footer Navigation

Owner footer의 navigation은 아이콘만 두는 대신 현재 page 상태를 글자로 읽을 수 있어야 한다.

- `Analytics` action은 `[값] views`를 함께 보여주고, active state에서는 `/{handle}/analytics`로 이동한다.
- `Analytics` view 값이 0일 때는 `No Views Today`로 표시한다.
- 배포 환경에서는 `Analytics` action을 disabled로 유지하되, text color는 일반 state와 동일하게 유지한다.
- `my page` action은 viewer가 가진 profile image를 함께 보여주고, image가 없을 때만 빈 avatar slot으로 대체한다.
- avatar slot과 text label은 한 덩어리로 동작해야 하며, text-only fallback으로 밀어내지 않는다.

### Toolbar Link Input Chrome

Owner editor의 link 입력은 toolbar 위에 따로 떠 있는 카드처럼 보이지 않아야 한다.

- link 입력의 최상위 wrapper는 toolbar header의 `bg`를 그대로 상속한다.
- 내부 `Field`와 `InputGroup`도 별도 배경을 다시 선언하지 않고 `bg-inherit`를 사용한다.
- 결과적으로 링크 입력은 toolbar 배경 안에서 한 덩어리로 읽히고, 배경/블러 톤이 중복되지 않아야 한다.
- 링크 아이콘 버튼은 toggle 역할을 하며, 열린 상태에서 다시 누르면 link input이 접히고 닫혀야 한다.

### Motion And Pointer Feel

Motion은 장식이 아니라 item 위치, drag affordance, public reveal 순서를 이해하게 만드는 피드백이다.

- item 추가/진입 motion은 scroll 위치 이동과 충돌하지 않아야 한다.
- 섹션 item이 focus-within 상태가 되어도 하단 fixed toolbar보다 위로 올라와서는 안 된다.
- grid item은 sibling보다 앞에 보여야 할 때만 z-order를 올리고, toolbar를 덮는 수준까지는 올라가지 않게 유지한다.
- hovered grid item은 인접 카드보다 항상 앞에 떠야 하므로, hover/focus-within 시 해당 item의 stacking order를 올려야 한다.
- profile bento toolbar와 그 안의 `ProfileBentoGridActions`는 hover 카드보다 더 위에 있어야 하므로, grid item보다 더 높은 z-order를 유지한다.
- drag motion을 고칠 때는 `docs/solutions/best-practices/profile-bento-v2-drag-motion-and-section-shadow-contract-2026-05-01.md`를 함께 확인한다.
- `prefers-reduced-motion` 사용자는 과한 motion 없이 같은 정보 구조를 이해할 수 있어야 한다.
- hover/focus/drag 상태는 pointer interception과 text selection 부작용을 실제로 확인한다.
- public readonly `/[handle]` 진입 motion은 profile surface가 먼저 아래에서 위로 올라오고, 그 뒤 bento surface가 더 작은 scale과 opacity 0 상태에서 늦게 등장해야 한다.
- readonly public 진입 motion은 layout 측정과 충돌하지 않게 wrapper transform/opacity만 바꾸고, grid geometry와 viewport-driven layout semantics는 그대로 유지한다.
- reduced-motion 환경에서는 y/scale 이동폭을 줄이고 opacity 위주로 같은 reveal 순서를 유지한다.
- owner editor `/[handle]` 진입 motion도 같은 reveal 순서를 유지하되, profile editor와 interactive grid 바깥의 root wrapper에서만 transform/opacity를 바꿔야 한다.
- editor 진입 motion은 grid drag/resize state와 분리되어야 하고, preview surface의 width/borderRadius transition과 겹쳐도 layout shift를 만들지 않아야 한다.

### Link Media Fallback

Link item의 thumbnail과 favicon 영역은 이미지 유무와 관계없이 같은 layout footprint를 유지해야 한다. 이미지가 없을 때도 영역은 남기되 skeleton처럼 옅은 회색 배경으로 비어 있는 media slot임을 드러낸다.

- thumbnail이 없으면 `bg-muted/60` 수준의 희미한 배경으로 렌더링해 로딩 skeleton과 비슷하게 처리한다.
- link thumbnail slot은 thumbnail을 보여주는 item size에서 thumbnail 존재 여부에 따라 사라지면 안 된다. thumbnail-capable size는 저장/크롤 전부터 media slot 크기를 먼저 잡아 layout rhythm을 유지한다.
- favicon이 없으면 작은 점이나 임의 아이콘을 만들지 않고 같은 크기의 옅은 회색 square placeholder를 유지한다.
- editor에서 link favicon/title 밀도나 URL 표시 여부를 바꾸면 readonly link item도 같은 footprint와 정보량으로 맞춘다.
- link URL text를 숨기는 경우 editor와 readonly 모두 숨겨야 하며, title과 thumbnail hierarchy만으로 같은 card rhythm을 유지한다.
- provider theme가 있는 link item은 provider 특성에 맞춘 짧은 CTA label을 보여준다. 이 label은 `src/lib/metadata/link-provider-theme.ts`의 provider theme entry에서 theme와 함께 관리한다.
- CTA label의 배경은 provider brand color를 사용하고, 텍스트는 brand color 대비가 더 높은 black 또는 white로 계산한다. 시각 의도상 더 선명한 white가 필요한 provider는 theme entry에서 override한다.
- readonly link item은 카드 전체가 이미 anchor이므로 CTA를 실제 nested button으로 만들지 않는다. 버튼처럼 보이는 text label로 렌더링해 invalid interactive nesting을 피한다.
- owner editor에서는 같은 CTA footprint를 유지하되 grid drag/edit affordance와 충돌하지 않도록 `grid-action` 외부 링크 action으로 렌더링한다.
- CTA label은 모바일/태블릿의 작은 card에서도 제목을 밀어내지 않도록 compact height와 responsive padding을 유지한다.
- 작은 정사각형 link item에서도 favicon/title 묶음과 CTA label은 세로로 `justify-between`처럼 떨어져야 하며, CTA는 카드 하단에 위치한다.
- thumbnail wrapper와 내부 image는 `pointer-events: none`을 유지한다.
- thumbnail 영역이 pointer event를 받으면 grid item drag/resize 시작점과 충돌할 수 있다.
- 2x2, 2x4, 1x4 link item에서 thumbnail/favicon이 있는 경우와 없는 경우 모두 editor/public visual parity와 resize control이 끊기지 않아야 한다. 1x2, 2x1처럼 thumbnail을 보여주지 않는 size에는 thumbnail slot을 만들지 않는다.
- YouTube link item은 `providerMetadata.payload.thumbnails.high.url`이 있으면 기존 `item.content.thumbnail`보다 우선해서 thumbnail slot에 렌더링한다. `providerMetadata.payload.statistics.subscriberCount`가 있으면 CTA label 옆에 compact 표기(`999`, `1K`, `1.3M`)로 함께 보여준다.
- CHZZK link item은 `providerMetadata.provider === "chzzk"`이고 `providerMetadata.payload.followerCount`가 있으면 CTA label 옆에 compact follower count 표기(`374.7K`)를 함께 보여준다.
- GitHub link item이 `provider === "github"`이고 `providerMetadata.viewType`가 `github_contributions_`로 시작하는 contributions view일 때는 thumbnail slot 대신 잔디 패널을 렌더링한다. `providerMetadata`가 없거나 contributions view가 아니면 기존 thumbnail 기반 metadata UI를 유지한다. 이 패널은 thumbnail-capable size에서만 보여야 한다.

### Text And Section Density

Text item과 section item은 owner가 editor에서 맞춘 밀도와 줄바꿈이 public readonly에서 바뀌지 않아야 한다.

- text item은 긴 단어, URL, 한글/영문 혼합 문장이 card 바깥으로 밀리지 않도록 editor와 readonly 모두 같은 wrapping policy를 쓴다.
- section item은 editor input에 좌우 inset을 추가하면 readonly title에도 같은 inset을 둔다.
- readonly surface에는 input hover/focus 배경만 없어야 하고, text size, weight, padding, truncation은 editor와 같은 presentation contract를 유지한다.

### Public Render Performance

공개 profile 접근은 링크 공유, 검색, 소셜 인앱 브라우저에서 가장 먼저 체감되는 surface다. 따라서 public readonly route는 아래 contract를 유지한다.

- public readonly grid는 `react-grid-layout`이 계산하는 compact/desktop 좌표, rowHeight, section height, card wrapper를 기준으로 editor와 같은 visual contract를 유지한다. CSS grid로 대체하면 저장된 layout semantics와 short viewport parity가 깨질 수 있다.
- public/editor grid는 `useContainerWidth({ measureBeforeMount: true })`의 `mounted`가 true가 되기 전까지 `react-grid-layout` canvas를 렌더하지 않는다. `initialWidth` 기반 첫 layout이 화면에 잡힌 뒤 실제 container width layout으로 재계산되면 entry reveal 중에 grid item transform transition이 겹쳐 끊겨 보인다.
- grid entry motion은 container width 측정이 끝난 뒤 실제 breakpoint와 rowHeight 기준 layout을 대상으로 시작해야 한다. 측정 전 shell은 ref만 유지하고 opacity/y hidden state에 머물러야 한다.
- public readonly grid breakpoint는 editor compact/desktop 전환과 같은 `2xl` 기준을 써야 하며, 모바일/태블릿에서 desktop layout이 먼저 풀리면 안 된다.
- public readonly `/[handle]` shell은 viewport를 줄이는 동안 가로 스크롤이 생기지 않도록 grid canvas width를 compact target으로 제한해야 한다. page shell clipping으로 숨기면 editor와 다른 잘림이 생긴다.
- public readonly grid는 public page에서만 viewport 폭으로 desktop 복귀를 판단하고, 내부 container가 잠깐 좁게 남아 있어도 desktop 4열 상태를 다시 풀 수 있어야 한다. contained preview surface는 실제 container width 기준을 유지한다.
- owner가 자신의 공개 페이지에 접근할 때 readonly surface가 먼저 보인 뒤 editor로 깜빡이며 바뀌면 안 된다. owner 여부는 서버 렌더 전에 결정하고, owner면 첫 HTML부터 editor surface만 렌더한다.
- owner surface의 analytics label은 첫 HTML의 blocking dependency가 아니어야 한다. public page 판별과 editor surface 렌더가 끝나면 먼저 진입시키고, analytics 수치는 hydration 뒤에 비동기 갱신한다.
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
- 브라우저 폭만 줄인 상태에서 `Copy my page`/`Share page`가 `Save`로 바뀌지 않는다.
- 추가, 삭제, drag, focus, save 같은 주요 flow가 layout shift 없이 이어진다.
- profile image crop surface가 dialog 없이 inline으로 열리고, apply 후 save dirty state가 활성화되는지 확인한다.
- hover-only controls는 keyboard focus로도 접근 가능하다.
- scroll/focus 변경은 autofocus, fixed footer toolbar, nested scroll container와 충돌하지 않는다.
- public readonly page와 owner editor가 의도한 차이만 갖는다.
- public readonly `/[handle]` 진입에서 profile surface와 bento surface reveal 순서가 기대대로 보이고, grid 측정이나 layout shift가 섞이지 않는다.
- owner editor `/[handle]` 진입에서 profile editor와 bento grid가 순서대로 드러나고, preview surface width transition과 충돌하지 않는다.

## Related

- `docs/solutions/best-practices/profile-bento-v2-drag-motion-and-section-shadow-contract-2026-05-01.md`
- `docs/solutions/documentation-gaps/frontend-ui-composition-map-2026-04-28.md`
- `docs/solutions/documentation-gaps/profile-page-domain-map-2026-04-28.md`
