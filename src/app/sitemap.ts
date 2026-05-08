import type { MetadataRoute } from "next";
import { getAppApiBaseURL } from "@/lib/api/base-url";
import { absoluteUrl } from "@/lib/seo";

type ListProfilePages200 = {
  pages: Array<{
    id: string;
    userId: string;
    handle: string;
    name: string | null;
    location: string | null;
    role: string | null;
    bio: string | null;
    image: string | null;
    backgroundImage: string | null;
    linkBlockPosition: number;
    createdAt: string;
    updatedAt: string;
  }>;
};

async function getProfilePagesForSitemap(): Promise<ListProfilePages200["pages"]> {
  const response = await fetch(`${getAppApiBaseURL()}/profile/pages`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to load profile pages for sitemap: ${response.status}`);
  }

  const data = (await response.json()) as ListProfilePages200;
  return data.pages;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPageRoutes = [
    "/",
    "/sign-in",
    "/sign-up",
    "/explore",
    "/changelog",
    "/roadmap",
  ] as const;
  const policyPageRoutes = ["/privacy", "/terms", "/refund"] as const;
  const handlePages = await getProfilePagesForSitemap();

  return [
    ...staticPageRoutes.map((route) => ({
      url: absoluteUrl(route),
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: route === "/" ? 1 : route === "/sign-in" || route === "/sign-up" ? 0.6 : 0.4,
    })),
    ...policyPageRoutes.map((route) => ({
      url: absoluteUrl(route),
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...handlePages.map((page) => ({
      url: absoluteUrl(`/${page.handle}`),
      lastModified: new Date(page.updatedAt),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
