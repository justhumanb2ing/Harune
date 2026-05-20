import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import type { Metadata } from "next";
import { Suspense } from "react";
import {
  BreadcrumbJsonLd,
  WebPageStructuredData,
} from "@/components/site-instrumentation/structured-data";
import { AppEntryCtaButton } from "@/components/website/app-entry-cta-button";
import ExploreSection, { ExploreSectionFallback } from "@/components/website/explore-section";
import { prefetchListProfilePagesQuery } from "@/lib/api/generated/http/profile-api/profile-api";
import { appConfig } from "@/lib/config";
import { createPageMetadata } from "@/lib/seo";

const exploreDescription = `Discover ${appConfig.projectName} creator pages and explore public profiles across the community.`;

export const metadata: Metadata = createPageMetadata({
  path: "/explore",
  title: "Explore",
  description: exploreDescription,
  keywords: [
    ...appConfig.keywords,
    `${appConfig.projectName} explore`,
    "creator discovery",
    "profile discovery",
    "creator pages",
    "profile pages",
  ],
  imageAlt: `${appConfig.projectName} explore preview`,
});

export default async function ExplorePage() {
  const queryClient = new QueryClient();

  await prefetchListProfilePagesQuery(queryClient, {
    request: { cache: "no-store" },
  });

  return (
    <>
      <WebPageStructuredData name="Explore" description={exploreDescription} path="/explore" />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Explore", path: "/explore" },
        ]}
      />
      <main className="relative">
        <div className="p-5">
          <div className="mx-auto flex max-w-7xl justify-end">
            <AppEntryCtaButton
              next="/"
              size="lg"
              className="brand-button py-5 px-5 rounded-sm font-bold shadow-sm"
            >
              Make your page
            </AppEntryCtaButton>
          </div>
        </div>
        <section className="flex h-full flex-col">
          <header className="flex flex-1 flex-col items-center justify-center px-6 py-8 pt-12">
            <div className="container flex max-w-7xl flex-col gap-4">
              <h2 className="text-primary text-3xl font-extrabold tracking-tight text-pretty lg:text-4xl">
                Explore beautiful pages crafted by others
              </h2>
            </div>
          </header>
          <HydrationBoundary state={dehydrate(queryClient)}>
            <Suspense fallback={<ExploreSectionFallback />}>
              <ExploreSection />
            </Suspense>
          </HydrationBoundary>
        </section>
      </main>
    </>
  );
}
