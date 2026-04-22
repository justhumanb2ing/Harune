"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ReactNode } from "react";

export function SortableShell({
  children,
  id,
}: {
  children: (args: {
    attributes: ReturnType<typeof useSortable>["attributes"];
    isDragging: boolean;
    listeners: ReturnType<typeof useSortable>["listeners"];
  }) => ReactNode;
  id: string;
}) {
  const { attributes, isDragging, listeners, setNodeRef, transform, transition } = useSortable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        position: "relative",
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 0,
      }}
    >
      {children({ attributes, isDragging, listeners })}
    </div>
  );
}
