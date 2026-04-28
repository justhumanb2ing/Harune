"use client";

import { Ssgoi, SsgoiTransition } from "@ssgoi/react";
import { drill, swap } from "@ssgoi/react/view-transitions";
import type { ReactNode } from "react";

const profileLayoutTransitionConfig = {
  transitions: [
    {
      from: "/app",
      to: "/app/*",
      transition: drill({
        opacity: true,
        physics: { inertia: { acceleration: 30, resistance: 1.2 } },
        direction: "enter",
      }),
    },
    {
      from: "/app/*",
      to: "/app",
      transition: drill({
        opacity: true,
        physics: { inertia: { acceleration: 30, resistance: 1.2 } },
        direction: "exit",
      }),
    },
    {
      from: "/app",
      to: "/analytics",
      transition: swap(),
      symmetric: true,
    },
  ],
};

type ProfileLayoutTransitionProps = {
  children: ReactNode;
  id: string;
};

export function ProfileLayoutTransition({ children, id }: ProfileLayoutTransitionProps) {
  return (
    <SsgoiTransition id={id} className="block h-full w-full max-w-full">
      <div className="min-h-full px-6">{children}</div>
    </SsgoiTransition>
  );
}

export function ProfileLayoutTransitionScope({ children }: { children: ReactNode }) {
  return <Ssgoi config={profileLayoutTransitionConfig}>{children}</Ssgoi>;
}
