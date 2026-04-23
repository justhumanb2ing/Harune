"use client";

import { cn } from "@/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ReactNode } from "react";

export function SortableShell({
  children,
  className,
  disabled = false,
  id,
}: {
  children: (args: {
    attributes: ReturnType<typeof useSortable>["attributes"];
    isDragging: boolean;
    listeners: ReturnType<typeof useSortable>["listeners"];
  }) => ReactNode;
  className?: string;
  disabled?: boolean;
  id: string;
}) {
  const { attributes, isDragging, listeners, setNodeRef, transform, transition } = useSortable({
    disabled,
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
      className={cn("shadow-brand", className)}
    >
      {children({ attributes, isDragging, listeners })}
    </div>
  );
}
