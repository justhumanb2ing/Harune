export default function AnalyticsLoading() {
  return (
    <main className="flex h-full min-h-0 flex-col gap-8 overflow-y-auto p-4 pb-24 sm:p-8 sm:pb-24 lg:pb-8">
      <div className="space-y-3">
        <div className="h-9 w-40 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-64 max-w-full animate-pulse rounded-md bg-muted" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="h-28 animate-pulse rounded-lg bg-muted" />
        <div className="h-28 animate-pulse rounded-lg bg-muted" />
        <div className="h-28 animate-pulse rounded-lg bg-muted" />
        <div className="h-28 animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="min-h-80 flex-1 animate-pulse rounded-lg bg-muted" />
      <aside className="fixed inset-x-0 bottom-0 block bg-background p-2 lg:hidden">
        <div className="h-12 w-full animate-pulse rounded-md bg-muted" />
      </aside>
    </main>
  );
}
