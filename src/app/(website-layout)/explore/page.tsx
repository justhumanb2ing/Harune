import type { Metadata } from "next";
import {
  BreadcrumbJsonLd,
  WebPageStructuredData,
} from "@/components/site-instrumentation/structured-data";
import ExploreSection from "@/components/website/explore-section";
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

export default function ExplorePage() {
  return (
    <>
      <WebPageStructuredData name="Explore" description={exploreDescription} path="/explore" />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Explore", path: "/explore" },
        ]}
      />
      <main className="relative h-dvh min-h-dvh">
        <ExploreSection />
      </main>
    </>
  );
}
