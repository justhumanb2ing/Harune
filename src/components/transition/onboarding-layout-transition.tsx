"use client";

import { Ssgoi } from "@ssgoi/react";
import { swap } from "@ssgoi/react/view-transitions";
import type { ReactNode } from "react";

const transitionConfig = {
  transitions: [
    {
      from: "/create",
      to: "/create/success",
      transition: swap({
        scaleOffset: 0.1,
        physics: {
          spring: {
            stiffness: 360,
            damping: 32,
            restDelta: 0.1,
            restSpeed: 1e14,
          },
        },
      }),
    },
  ],
};

export function OnboardingLayoutTransition({ children }: { children: ReactNode }) {
  return <Ssgoi config={transitionConfig}>{children}</Ssgoi>;
}
