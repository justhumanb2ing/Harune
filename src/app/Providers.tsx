"use client";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getQueryClient } from "@/lib/react-query/query-client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import type React from "react";

function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster position="top-center" className="dark:hidden" />
        </QueryClientProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default Providers;
