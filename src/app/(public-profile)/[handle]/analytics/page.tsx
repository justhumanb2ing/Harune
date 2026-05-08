import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type AnalyticsPageProps = {
  params: Promise<{
    handle: string;
  }>;
};

export async function generateMetadata({ params }: AnalyticsPageProps): Promise<Metadata> {
  const { handle } = await params;

  return {
    title: `${handle} analytics`,
    description: `View clicks, visits, and engagement for @${handle}.`,
    robots: {
      follow: false,
      index: false,
    },
  };
}

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const { handle } = await params;

  return (
    <>
      <main className="flex h-full min-h-0 flex-col gap-12 overflow-y-auto p-4 pt-10 pb-24 sm:p-8 sm:pb-24 lg:pb-8">
        <section className="space-y-3 rounded-3xl border bg-card p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Analytics
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">{handle} analytics</h1>
          <p className="text-muted-foreground">
            Analytics remains as layout only while the backend is being split out of the frontend.
          </p>
        </section>
      </main>
      <aside className="fixed inset-x-0 bottom-0 block bg-background p-2 lg:hidden">
        <Button
          nativeButton={false}
          type="button"
          variant="outline"
          size="lg"
          className="h-12 w-full text-lg font-bold! brand-button"
          render={<Link href={`/${handle}`}>Back to page</Link>}
        />
      </aside>
    </>
  );
}
