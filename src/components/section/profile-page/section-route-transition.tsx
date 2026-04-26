"use client";

import { SsgoiTransition } from "@ssgoi/react";
import type { ReactNode } from "react";

type SectionRouteTransitionProps = {
  children: ReactNode;
  id: string;
};

export function SectionRouteTransition({ children, id }: SectionRouteTransitionProps) {
  return (
    <SsgoiTransition id={id} className="block h-full w-full max-w-full">
      <div className="min-h-full px-6">{children}</div>
    </SsgoiTransition>
  );
}
