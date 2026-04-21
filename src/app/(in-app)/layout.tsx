import type React from "react";

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-primary-foreground">
      <div className="min-h-0 flex-1 w-full">{children}</div>
    </div>
  );
}

export default AppLayout;
