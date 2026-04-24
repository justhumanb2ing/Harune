import type React from "react";

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-dvh flex-col bg-primary-foreground">
      <div className="min-h-0 h-full flex-1 w-full">{children}</div>
    </div>
  );
}

export default AppLayout;
