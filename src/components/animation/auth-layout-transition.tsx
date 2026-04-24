"use client";

import { Ssgoi } from "@ssgoi/react";
import { swap } from "@ssgoi/react/view-transitions";
import type { ReactNode } from "react";

const transitionConfig = {
  transitions: [
    {
      from: "/sign-in",
      to: "/sign-up",
      transition: swap(),
      symmetric: true,
    },
  ],
};

export default function AuthLayoutTransition({ children }: { children: ReactNode }) {
  return <Ssgoi config={transitionConfig}>{children}</Ssgoi>;
}
