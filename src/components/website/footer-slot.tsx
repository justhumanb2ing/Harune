"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/website/footer";

export function FooterSlot() {
  const pathname = usePathname();

  if (pathname.startsWith("/v2/")) {
    return null;
  }

  return <Footer />;
}
