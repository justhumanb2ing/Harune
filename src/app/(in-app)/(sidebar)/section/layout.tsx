import { SectionRouteTransition } from "@/components/section/profile-page/section-route-transition";
import type { ReactNode } from "react";

export default function SectionLayout({ children }: { children: ReactNode }) {
  return (
    <div className="container mx-auto max-w-md py-10">
      <SectionRouteTransition>{children}</SectionRouteTransition>
    </div>
  );
}
