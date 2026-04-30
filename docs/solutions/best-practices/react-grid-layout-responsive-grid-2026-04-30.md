---
title: React Grid Layout responsive grid prototype
date: 2026-04-30
category: best-practices
module: website-layout-v2
problem_type: implementation_note
component: frontend
severity: medium
applies_when:
  - Building a responsive, draggable, resizable grid with react-grid-layout v2
  - Testing profile-like block layout behavior before integrating with persisted data
  - Debugging grid breakpoint, compaction, add/remove, or placeholder behavior
tags: [react-grid-layout, responsive-grid, drag-and-drop, resizing, prototype]
---

# React Grid Layout responsive grid prototype

## Context
`src/app/(website-layout)/v2/grid-test.tsx` is a client-side prototype for validating `react-grid-layout` v2 behavior before applying the pattern to a production block editor surface.

The prototype intentionally uses the v2 API:

- `Responsive` from `react-grid-layout`
- `useContainerWidth` from `react-grid-layout`
- no `react-grid-layout/legacy`
- no `WidthProvider`

The goal is a responsive grid that supports resizing, dynamic add/remove, predictable breakpoint behavior, and clear drag placeholder visuals.

## Final Rules
The grid uses two logical breakpoints:

| Breakpoint | Container width | Columns |
|---|---:|---:|
| `compact` | `< 820px` | `2` |
| `desktop` | `>= 820px` | `4` |

The important detail is that `react-grid-layout` v2 resolves breakpoints with `width > breakpoint`, not `width >= breakpoint`.

So this is intentional:

```ts
const BREAKPOINTS = {
  desktop: 819,
  compact: 0,
};
```

At exactly `820px`, `820 > 819` is true, so the grid uses the `desktop` breakpoint and renders `4` columns.

## Container Sizing
The outer measured wrapper is responsible for the width passed into `Responsive`:

```tsx
<div className="w-[380px] max-w-full lg:w-[864px]" ref={containerRef}>
```

Current sizing assumptions:

| Viewport group | Wrapper class | Nominal width |
|---|---|---:|
| mobile/tablet | `w-[380px]` | `380px` |
| desktop | `lg:w-[864px]` | `864px` |

Grid spacing:

```ts
const GRID_MARGIN = [32, 32] as const;
const GRID_PADDING = [0, 0] as const;
const ROW_HEIGHT = {
  desktop: 80,
  compact: 71,
};
```

`containerPadding` is `0` so the grid begins at the wrapper edge. `margin` is `32px` for both breakpoints.

The target geometry is:

| Breakpoint | Container width | Columns | Column width | Row height | Margin |
|---|---:|---:|---:|---:|---:|
| `desktop` | `864px` | `4` | `192px` | `80px` | `32px` |
| `compact` | `380px` | `2` | `174px` | `71px` | `32px` |

The horizontal margin is derived from:

```ts
columnWidth = (containerWidth - marginX * (cols - 1) - paddingX * 2) / cols;
```

For desktop:

```ts
(864 - 32 * 3) / 4 = 192;
```

For compact:

```ts
(380 - 32) / 2 = 174;
```

`Responsive` uses a single `rowHeight` number, so the prototype computes the active breakpoint from the measured width and passes the matching row height:

```ts
const activeBreakpoint: GridBreakpoint = width > BREAKPOINTS.desktop ? "desktop" : "compact";

<Responsive rowHeight={ROW_HEIGHT[activeBreakpoint]} />
```

The row height is not equal to the column width. It is chosen so common block sizes produce square modules with the current allowed height steps:

```text
desktop w:1,h:2 = 192px wide x (80 * 2 + 32) = 192px tall
compact w:1,h:2 = 174px wide x (71 * 2 + 32) = 174px tall
```

This means `h:2` is the square card height for a `w:1` item in both breakpoints. If the mobile wrapper width or vertical margin changes, recompute compact row height with:

```ts
rowHeight = (columnWidth - marginY) / 2;
```

## Item Constraints
Every item follows the same size constraints:

```ts
minW: 1,
minH: 1,
maxW: 4,
maxH: 4,
isResizable: true,
```

On desktop, an item can expand up to `4` columns. On compact screens, the actual maximum width is effectively limited by the grid's `2` columns even though `maxW` remains `4`.

Card heights are snapped to three allowed values:

```ts
function snapCardHeight(height: number) {
  if (height <= 1) {
    return 1;
  }

  return height <= 3 ? 2 : 4;
}
```

So resizable card `h` values normalize to:

```text
1, 2, 4
```

All initial items were normalized so no regular item starts taller than the configured maximum:

```ts
h: 4,
maxH: 4,
```

`wide-thin-placeholder` is the current exception. It is locked to the active column count and uses a fixed `h:2` layout footprint with a one-row visual card.

## Resize Controls
Do not use the default `react-resizable` handle UI for this prototype.

The grid disables the built-in resize interaction:

```tsx
resizeConfig={{ enabled: false }}
```

The hidden handle DOM can still exist, so the wrapper also removes it from the visual and pointer surface:

```tsx
[&_.react-resizable-handle]:hidden!
[&_.react-resizable-handle]:pointer-events-none!
```

Instead, each regular card shows a `ToggleGroup` in the bottom-right corner on hover/focus. The group is marked as `.grid-action`, so clicking a resize option does not start a drag:

```tsx
<ToggleGroup className="grid-action ..." />
```

Supported resize options are explicit `w x h` presets:

```ts
const RESIZE_OPTIONS = [
  { id: "1x2", w: 1, h: 2 },
  { id: "1x4", w: 1, h: 4 },
  { id: "2x2", w: 2, h: 2 },
  { id: "2x4", w: 2, h: 4 },
  { id: "2x1", w: 2, h: 1 },
  { id: "4x1", w: 4, h: 1 },
];
```

When applying an option, update both breakpoint layouts. Width is clamped by the active breakpoint's column count, so `4x1` becomes `2x1` in the compact two-column layout:

```ts
w: Math.min(option.w, COLS[breakpoint])
```

Each option can be hidden for future item types without changing the ToggleGroup rendering code:

```ts
type ResizeOption = {
  id: ResizeOptionId;
  w: number;
  h: number;
  hiddenForItemTypes?: readonly string[];
};
```

Then filter options through the item metadata:

```ts
function getResizeOptionsForItem(item: GridItem) {
  return RESIZE_OPTIONS.filter(
    (option) => !item.itemType || !option.hiddenForItemTypes?.includes(item.itemType)
  );
}
```

No concrete item type restrictions are defined yet; the structure exists so a future block type can hide individual presets.

Resize/reflow motion is intentionally slower than the library default:

```tsx
[&_.react-grid-item]:duration-[600ms]!
[&_.react-grid-item]:ease-out!
```

### Split Visual Items
The prototype also tests an item whose grid footprint and visible card are intentionally different.

`wide-thin-placeholder` occupies two rows in layout state:

```ts
{
  i: THIN_PLACEHOLDER_ITEM_ID,
  w: cols,
  h: 2,
  minH: 2,
  maxH: 2,
}
```

But the rendered card is only one row tall and is pinned to the bottom of the two-row grid item:

```tsx
<div className="pointer-events-none flex items-end">
  <div className="h-[var(--thin-item-visible-height)] pointer-events-auto">
    ...
  </div>
</div>
```

This keeps the real grid reservation at `h:2` while making only the lower `h:1` area visible. The upper `h:1` area has no card, border, background, or pointer target.

The visible height is breakpoint-aware:

```ts
"--thin-item-visible-height": `${ROW_HEIGHT[activeBreakpoint]}px`
```

The same visible card is the only drag hit target. The wrapper uses `pointer-events-none`, and the visible card restores `pointer-events-auto`. Add `cursor-grab active:cursor-grabbing` to the visible card so the drag affordance matches the actual interactive area.

## Dynamic Add/Remove
The prototype keeps two pieces of state:

```ts
const [items, setItems] = useState<GridItem[]>(INITIAL_GRID_ITEMS);
const [layouts, setLayouts] = useState<ResponsiveLayouts<GridBreakpoint>>(INITIAL_LAYOUTS);
```

`items` controls which React children are rendered.

`layouts` controls the `react-grid-layout` coordinates for both breakpoints.

When adding an item, the code adds layout entries to both `desktop` and `compact`.

New dynamic items start as `w:1, h:2`. With the current breakpoint-specific row heights, that produces a square card in both desktop and compact layouts.

When removing an item, the code removes it from the rendered item list and from every breakpoint layout:

```ts
setLayouts((currentLayouts) => ({
  desktop: (currentLayouts.desktop ?? []).filter((item) => item.i !== id),
  compact: (currentLayouts.compact ?? []).filter((item) => item.i !== id),
}));
```

Remove buttons use the `.grid-action` class and are excluded from drag start:

```tsx
dragConfig={{ bounded: false, cancel: ".grid-action", enabled: true }}
```

## Add Positioning
Do not use `layout.length % cols` for the new item's `x` value.

That fails when the initial layout already has items. For example, with `5` existing items and `4` columns:

```ts
5 % 4 === 1;
```

The first dynamic item starts at the second column, producing a `2-3-4-1` insertion sequence.

Do not use only a dynamic item counter either. That also fails when existing items have `w > 1`.

The final implementation computes occupied cells from the current layout and finds the first empty cell left-to-right, top-to-bottom:

```ts
function getOccupiedCells(layout: readonly LayoutItem[]) {
  const occupiedCells = new Set<string>();

  for (const item of layout) {
    for (let y = item.y; y < item.y + item.h; y++) {
      for (let x = item.x; x < item.x + item.w; x++) {
        occupiedCells.add(`${x}:${y}`);
      }
    }
  }

  return occupiedCells;
}
```

Then:

```ts
function findFirstEmptyCell(layout: readonly LayoutItem[], cols: number) {
  const occupiedCells = getOccupiedCells(layout);
  let y = 0;

  while (true) {
    for (let x = 0; x < cols; x++) {
      if (!occupiedCells.has(`${x}:${y}`)) {
        return { x, y };
      }
    }

    y++;
  }
}
```

This preserves the expected behavior:

```text
a b b _
```

Add produces:

```text
a b b c
```

instead of placing `c` on the next row due to a collision.

## Compactor Choice
The final prototype uses:

```ts
import { fastVerticalCompactor } from "react-grid-layout/extras";
```

and:

```tsx
compactor={fastVerticalCompactor}
```

`fastVerticalCompactor` is the optimized non-overlap vertical compactor. It keeps `allowOverlap: false`, so it does not conflict with this prototype's collision/reflow requirements.

This keeps the official vertical compaction behavior closer than a custom row compactor while reducing compaction cost for larger layouts.

### Swap Is Not Guaranteed
`react-grid-layout` does not model drag intent as an item-to-item swap.

When the layout starts as:

```text
a b
c
```

and `a` is dragged into `b`'s position, the engine does not apply:

```text
b a
c
```

as a semantic exchange. It applies move, collision resolution, and vertical compaction. Once `a` leaves its original cell, that empty space is also available to the compactor, so another item such as `c` may move up before `a` settles elsewhere:

```text
b c
  a
```

This is expected for compaction-based grids. If the product needs true pairwise swap semantics, do not rely on the compactor alone. Keep an explicit ordered slot model and update that order in `onDragStop`.

### Why Not `wrapCompactor`
`wrapCompactor` from `react-grid-layout/extras` looks like a row-flow compactor, but it can create overlap with taller items.

In testing, when items could have `h: 2`, `wrapCompactor` did not reserve the full occupied height in the desired way, so later items could visually overlap earlier taller items.

### Why Not Custom Row Compactor
A custom height-aware row compactor can prevent overlap, but it can also break swap/reorder intent.

Example:

```text
a b b c
d e
```

Dragging `b` toward `e` should behave like a swap/reflow. A naive custom row compactor that sorts by final `y, x` can reorder the items into:

```text
a c d e
b b
```

That happens because the dragged item's `y` increases, so it is sorted after the other items and packed later.

The lesson: compactor ordering is not the same as drag intent. If a future editor needs exact list-like row insertion semantics, keep an explicit order array and update it on drag stop instead of inferring order from `y, x`.

### Overlap Compactors
`fastVerticalOverlapCompactor` and `fastHorizontalOverlapCompactor` are not for this UX.

`overlap` means grid items may share the same grid cells. That is useful for layering or freeform canvases, but this prototype wants collision resolution and reflow, not stacked items.

## Drag Behavior
The prototype uses:

```tsx
dragConfig={{ bounded: false, cancel: ".grid-action", enabled: true }}
```

`bounded: false` is intentional while testing. It allows a dragged item to move into space beyond the current visible grid area so the layout can create new rows when needed.

If this prototype becomes a production editor, re-test whether `bounded: false` creates unacceptable off-grid movement. If it does, the proper fix is likely explicit row insertion/reorder logic rather than simply returning to `bounded: true`.

## Placeholder Styling
The red drop target shown by `react-grid-layout` is the drag/resize placeholder.

The class is:

```css
.react-grid-placeholder
```

The prototype scopes placeholder styling to the grid wrapper:

```tsx
[&_.react-grid-placeholder]:bg-secondary!
[&_.react-grid-placeholder]:rounded-xl!
[&_.react-grid-placeholder]:opacity-100!
```

The placeholder radius intentionally follows the item radius. Current items use `rounded-xl`, so the placeholder must also use `rounded-xl!` rather than a custom arbitrary radius.

The placeholder is sent behind real items so it does not cover content while resizing:

```tsx
[&_.react-grid-placeholder]:z-0!
[&_.react-grid-item:not(.react-grid-placeholder)]:z-10
```

The currently dragged item is elevated above other items:

```tsx
[&_.react-draggable-dragging]:z-20!
```

The placeholder uses a subtle inset shadow so it reads like a recessed slot instead of a flat border:

```tsx
[&_.react-grid-placeholder]:shadow-[inset_0_1px_6px_rgb(0_0_0_/_0.08),inset_0_-1px_1px_rgb(255_255_255_/_0.8)]!
```

### Split Visual Placeholder
`react-grid-layout` clones the active layout item when creating the placeholder. So if an item occupies `w:4, h:2`, the internal placeholder also occupies `w:4, h:2`.

For `wide-thin-placeholder`, the prototype only changes the placeholder's visual box, not the collision footprint. Drag/resize start toggles a wrapper class when the active item is `THIN_PLACEHOLDER_ITEM_ID`:

```tsx
onDragStart={(_, __, newItem) => {
  setIsThinPlaceholderActive(newItem?.i === THIN_PLACEHOLDER_ITEM_ID);
}}
onDragStop={() => {
  setIsThinPlaceholderActive(false);
}}
onResizeStart={(_, __, newItem) => {
  setIsThinPlaceholderActive(newItem?.i === THIN_PLACEHOLDER_ITEM_ID);
}}
onResizeStop={() => {
  setIsThinPlaceholderActive(false);
}}
```

When active, the placeholder is visually reduced to one row and shifted down by one row plus the vertical margin:

```tsx
[&_.react-grid-placeholder]:h-[var(--thin-placeholder-height)]!
[&_.react-grid-placeholder]:translate-y-[var(--thin-placeholder-offset)]!
```

```ts
"--thin-placeholder-height": `${ROW_HEIGHT[activeBreakpoint]}px`,
"--thin-placeholder-offset": `${ROW_HEIGHT[activeBreakpoint] + GRID_MARGIN[1]}px`,
```

This makes the lower half of the `h:2` placeholder visible and hides the upper half. The layout engine still resolves collisions and reflow with the original `h:2` footprint.

## Current Known Tradeoffs
- `fastVerticalCompactor` gives better default collision/reflow behavior than the custom row compactor, but it is not a pairwise swap or full list-order model.
- `bounded: false` helps test creating space below filled rows, but production UX may need tighter drag bounds.
- Add positioning is deterministic for the current `w:1, h:2` item template because the first empty top-left cell is enough for the existing layout shape. If new item templates later support default `w > 1` or more varied heights, `findFirstEmptyCell` should become `findFirstFittingRect`.
- `margin` and `rowHeight` are intentionally coupled to the wrapper width. If the wrapper width changes, recompute both values rather than changing one independently.
- Resize presets are defined in desktop grid units. Compact layouts clamp widths to two columns, so width-specific presets may collapse to the same compact footprint.
- Split visual items can reserve more grid space than they show. That is useful for staggered or anchored cards, but hit targets, cursor styling, and placeholder visuals must be explicitly aligned with the visible area.
- Responsive layout state is maintained for both breakpoints. If the production editor persists layouts, persist breakpoint-specific layouts or define a canonical layout with deterministic projection rules.

## Verification
For focused validation of this prototype:

```bash
bunx biome check 'src/app/(website-layout)/v2/grid-test.tsx'
```

```bash
bunx tsc --noEmit --pretty false --skipLibCheck --jsx react-jsx --moduleResolution bundler --module esnext --target es2022 --lib dom,dom.iterable,es2022 --types react,react-dom 'src/app/(website-layout)/v2/grid-test.tsx'
```

Whole-repo TypeScript can fail on unrelated baseline test matcher typings, so use file-level checks for this prototype unless the repo baseline is cleaned up.
