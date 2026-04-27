import type { Metadata } from "next";
import type React from "react";

export const metadata: Metadata = {
  robots: {
    follow: false,
    index: false,
  },
};

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-dvh flex-col bg-background">
      <div className="min-h-0 h-full flex-1 w-full">{children}</div>
    </div>
  );
}

export default AppLayout;
