import { Loader2Icon } from "lucide-react";

export default function AnalyticsLoading() {
  return (
    <main className="flex h-full min-h-0 flex-col gap-8 overflow-y-auto p-4 pb-24 sm:p-8 sm:pb-24 lg:pb-8 items-center justify-center">
      <Loader2Icon className="animate-spin" />
    </main>
  );
}
