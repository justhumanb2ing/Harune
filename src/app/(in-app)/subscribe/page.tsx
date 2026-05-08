import { Button } from "@/components/ui/button";
import { appConfig } from "@/lib/config";

export default async function SubscribePage() {
  return (
    <main className="min-h-lvh p-6">
      <section className="mx-auto flex min-h-lvh max-w-4xl flex-col justify-center gap-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Subscription
          </p>
          <h1 className="text-4xl font-semibold tracking-tight">Billing flow is disconnected</h1>
          <p className="text-muted-foreground">
            {appConfig.projectName} keeps the page shell, but checkout and auth-backed pricing
            lookups are disabled.
          </p>
        </div>

        <div className="rounded-3xl border bg-card p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-secondary/40 p-4">
              <h2 className="font-semibold">Plan lookup</h2>
              <p className="text-sm text-muted-foreground">Static shell only.</p>
            </div>
            <div className="rounded-2xl bg-secondary/40 p-4">
              <h2 className="font-semibold">Checkout redirect</h2>
              <p className="text-sm text-muted-foreground">Disabled in this frontend.</p>
            </div>
          </div>

          <Button type="button" disabled className="mt-6 w-full">
            Continue
          </Button>
        </div>
      </section>
    </main>
  );
}
