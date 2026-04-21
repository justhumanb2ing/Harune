"use client";

import * as React from "react";

type SlotProps = React.HTMLAttributes<HTMLElement> & {
  children?: React.ReactNode;
  ref?: React.Ref<unknown>;
};

function mergeRefs<T>(...refs: Array<React.Ref<T> | undefined>): React.RefCallback<T> {
  return (value) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === "function") {
        ref(value);
      } else {
        (ref as React.MutableRefObject<T | null>).current = value;
      }
    }
  };
}

function composeEventHandlers<E>(original?: (event: E) => void, next?: (event: E) => void) {
  return (event: E) => {
    original?.(event);
    next?.(event);
  };
}

function Slot({ children, ...props }: SlotProps) {
  if (!React.isValidElement(children)) {
    return null;
  }

  const ownProps = props as Record<string, unknown>;
  const childProps = (children.props ?? {}) as Record<string, unknown>;
  const mergedProps: Record<string, unknown> = { ...ownProps, ...childProps };

  for (const key of Object.keys(ownProps)) {
    if (key.startsWith("on")) {
      const ours = ownProps[key];
      const theirs = childProps[key];
      if (typeof ours === "function" && typeof theirs === "function") {
        mergedProps[key] = composeEventHandlers(
          ours as (event: unknown) => void,
          theirs as (event: unknown) => void
        );
      }
    }
  }

  const oursRef = (ownProps as { ref?: React.Ref<unknown> }).ref;
  const theirsRef = (childProps as { ref?: React.Ref<unknown> }).ref;
  if (oursRef || theirsRef) {
    mergedProps.ref = mergeRefs(oursRef, theirsRef);
  }

  return React.cloneElement(children, mergedProps);
}

export { Slot };
