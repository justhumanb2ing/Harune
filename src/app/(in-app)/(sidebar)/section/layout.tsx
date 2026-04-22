import type { ReactNode } from "react";

export default function SectionLayout({ children }: { children: ReactNode }) {
  return <div className="container mx-auto max-w-md">{children}</div>;
}
