export const PROFILE_BENTO_DRAG_SCROLL_EDGE_PX = 96;
export const PROFILE_BENTO_DRAG_SCROLL_MAX_SPEED_PX = 28;

export function getPointerCoordinatesFromEvent(event: Event) {
  const touchEvent = event as Event & {
    touches?: TouchList;
    changedTouches?: TouchList;
  };

  if (
    "clientX" in event &&
    "clientY" in event &&
    typeof event.clientX === "number" &&
    typeof event.clientY === "number"
  ) {
    return { x: event.clientX, y: event.clientY };
  }

  if (touchEvent.touches && touchEvent.touches.length > 0) {
    const touch = touchEvent.touches[0];

    return { x: touch.clientX, y: touch.clientY };
  }

  if (touchEvent.changedTouches && touchEvent.changedTouches.length > 0) {
    const touch = touchEvent.changedTouches[0];

    return { x: touch.clientX, y: touch.clientY };
  }

  return null;
}

export function getVerticalAutoScrollDelta(
  pointerY: number,
  viewportTop: number,
  viewportBottom: number
) {
  const clampedPointerY = Math.min(Math.max(pointerY, viewportTop), viewportBottom);
  const distanceToTop = clampedPointerY - viewportTop;
  const distanceToBottom = viewportBottom - clampedPointerY;

  if (distanceToTop < PROFILE_BENTO_DRAG_SCROLL_EDGE_PX) {
    const ratio = 1 - distanceToTop / PROFILE_BENTO_DRAG_SCROLL_EDGE_PX;

    return -Math.max(1, Math.round(ratio * PROFILE_BENTO_DRAG_SCROLL_MAX_SPEED_PX));
  }

  if (distanceToBottom < PROFILE_BENTO_DRAG_SCROLL_EDGE_PX) {
    const ratio = 1 - distanceToBottom / PROFILE_BENTO_DRAG_SCROLL_EDGE_PX;

    return Math.max(1, Math.round(ratio * PROFILE_BENTO_DRAG_SCROLL_MAX_SPEED_PX));
  }

  return 0;
}
