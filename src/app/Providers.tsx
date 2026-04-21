"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { getQueryClient } from "@/lib/react-query/query-client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import type React from "react";
import { Suspense } from "react";
import { Toaster } from "sonner";

function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <Suspense>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <TooltipProvider>
          <QueryClientProvider client={queryClient}>
            {children}
            <Toaster position="top-center" className="dark:hidden" richColors />
          </QueryClientProvider>
        </TooltipProvider>
      </ThemeProvider>
    </Suspense>
  );
}

export default Providers;
