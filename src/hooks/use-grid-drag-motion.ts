import { useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { useState } from "react";
import type { LayoutItem } from "react-grid-layout";
import { THIN_PLACEHOLDER_ITEM_ID } from "@/lib/grid/grid-config";

function getPointerClientX(event: Event) {
  if ("clientX" in event && typeof event.clientX === "number") {
    return event.clientX;
  }

  return null;
}

export function useGridDragMotion() {
  const [isThinPlaceholderActive, setIsThinPlaceholderActive] = useState(false);
  const [activeDragItemId, setActiveDragItemId] = useState<string | null>(null);
  const [activeDragIntentItemId, setActiveDragIntentItemId] = useState<string | null>(null);
  const pointerDeltaX = useMotionValue(0);
  const pointerClientX = useMotionValue(0);
  const reducedRotate = useMotionValue(0);
  const reducedX = useMotionValue(0);
  const shouldReduceMotion = useReducedMotion();
  const dragRotate = useSpring(
    useTransform(pointerDeltaX, [-64, 0, 64], [-16, 0, 16], { clamp: true }),
    {
      damping: 10,
      stiffness: 220,
      mass: 0.55,
    }
  );
  const dragX = useSpring(
    useTransform(pointerDeltaX, [-64, 0, 64], [-18, 0, 18], { clamp: true }),
    {
      damping: 12,
      stiffness: 240,
      mass: 0.5,
    }
  );

  function updateDragPointer(event: Event) {
    const clientX = getPointerClientX(event);

    if (clientX === null) {
      return;
    }

    pointerDeltaX.set(clientX - pointerClientX.get());
    pointerClientX.set(clientX);
  }

  function startDrag(newItem: LayoutItem | null | undefined, event: Event) {
    const clientX = getPointerClientX(event);

    if (clientX !== null) {
      pointerClientX.set(clientX);
      pointerDeltaX.set(0);
    }

    setActiveDragItemId(newItem?.i ?? null);
    setIsThinPlaceholderActive(newItem?.i === THIN_PLACEHOLDER_ITEM_ID);
  }

  function stopDrag() {
    setActiveDragItemId(null);
    setActiveDragIntentItemId(null);
    setIsThinPlaceholderActive(false);
    pointerDeltaX.set(0);
  }

  function startDragIntent(itemId: string) {
    setActiveDragIntentItemId(itemId);
  }

  function stopDragIntent() {
    setActiveDragIntentItemId(null);
  }

  function startResize(newItem: LayoutItem | null | undefined) {
    setIsThinPlaceholderActive(newItem?.i === THIN_PLACEHOLDER_ITEM_ID);
  }

  function stopResize() {
    setIsThinPlaceholderActive(false);
  }

  return {
    activeDragItemId,
    activeDragIntentItemId,
    cardRotate: shouldReduceMotion ? reducedRotate : dragRotate,
    cardX: shouldReduceMotion ? reducedX : dragX,
    isThinPlaceholderActive,
    startDrag,
    startDragIntent,
    stopDrag,
    stopDragIntent,
    startResize,
    stopResize,
    updateDragPointer,
  };
}
