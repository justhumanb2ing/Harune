"use client";

import { Ssgoi } from "@ssgoi/react";
import { drill, swap } from "@ssgoi/react/view-transitions";
import type { ReactNode } from "react";

const sectionTransitionConfig = {
  transitions: [
    {
      from: "/section",
      to: "/section/*",
      transition: drill({
        opacity: true,
        physics: { inertia: { acceleration: 30, resistance: 1.2 } },
        direction: "enter",
      }),
    },
    {
      from: "/section/*",
      to: "/section",
      transition: drill({
        opacity: true,
        physics: { inertia: { acceleration: 30, resistance: 1.2 } },
        direction: "exit",
      }),
    },
    {
      from: "/section",
      to: "/analytics",
      transition: swap(),
      symmetric: true,
    },
  ],
};

export function SectionTransitionScope({ children }: { children: ReactNode }) {
  return <Ssgoi config={sectionTransitionConfig}>{children}</Ssgoi>;
}
