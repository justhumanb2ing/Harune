import { AnalyticsPageClient } from "@/app/(in-app)/(sidebar)/analytics/page-client";
import { SsgoiTransition } from "@ssgoi/react";

export default function AnalyticsPage() {
  return (
    <SsgoiTransition id="/analytics" className="block h-full">
      <main className="flex h-full min-h-0 p-8 flex-col gap-12">
        <header className="space-y-3">
          <h1 className="text-3xl">Analytics</h1>
        </header>
        <AnalyticsPageClient />
      </main>
    </SsgoiTransition>
  );
}
