import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import type { Metadata } from "next";
import {
  BreadcrumbJsonLd,
  WebPageStructuredData,
} from "@/components/site-instrumentation/structured-data";
import ExploreSection from "@/components/website/explore-section";
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
        <HydrationBoundary state={dehydrate(queryClient)}>
          <ExploreSection />
        </HydrationBoundary>
      </main>
    </>
  );
}
