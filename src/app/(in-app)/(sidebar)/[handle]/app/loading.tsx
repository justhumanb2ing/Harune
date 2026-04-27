export default function AppSectionLoading() {
  return (
    <div className="relative flex h-full min-h-0 flex-row gap-4">
      <section className="relative min-h-0 flex-1 overflow-hidden overflow-y-auto">
        <div className="mx-auto min-h-full w-full max-w-full px-4 py-10 pb-24 sm:max-w-sm sm:px-0 lg:pb-8">
          <div className="space-y-8">
            <div className="h-9 w-36 animate-pulse rounded-md bg-muted" />
            <div className="grid grid-cols-2 gap-2">
              <div className="aspect-square animate-pulse rounded-2xl bg-muted" />
              <div className="aspect-square animate-pulse rounded-2xl bg-muted" />
            </div>
            <div className="space-y-2">
              <div className="h-16 animate-pulse rounded-2xl bg-muted" />
              <div className="h-16 animate-pulse rounded-2xl bg-muted" />
            </div>
          </div>
        </div>
      </section>
      <section className="hidden min-h-0 flex-1 overflow-hidden lg:block">
        <div className="h-full w-full animate-pulse bg-muted/40" />
      </section>
      <aside className="fixed inset-x-0 bottom-0 block bg-background p-2 lg:hidden">
        <div className="h-12 w-full animate-pulse rounded-md bg-muted" />
      </aside>
    </div>
  );
}
