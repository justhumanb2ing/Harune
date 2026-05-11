import type { Metadata } from "next";
import {
  BreadcrumbJsonLd,
  WebPageStructuredData,
} from "@/components/site-instrumentation/structured-data";
import ExploreSection from "@/components/website/explore-section";
import { getAppApiBaseURL } from "@/lib/api/base-url";
import type { ListProfilePages200 } from "@/lib/api/generated/http/schemas/profile-api";
import { appConfig } from "@/lib/config";
import { createPageMetadata } from "@/lib/seo";

const exploreDescription = `Discover ${appConfig.projectName} creator pages and explore public profiles across the community.`;

async function getExploreProfilePages(): Promise<ListProfilePages200["pages"]> {
  try {
    const response = await fetch(`${getAppApiBaseURL()}/profile/pages`, {
      cache: "no-store",
    });
    
    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as ListProfilePages200;
    console.log(data)
    return data.pages;
  } catch {
    return [];
  }
}

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
  const pages = await getExploreProfilePages();

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
        <ExploreSection pages={pages} />
      </main>
    </>
  );
}
