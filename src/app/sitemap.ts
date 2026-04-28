import { db } from "@/db";
import { profilePages } from "@/db/schema/profile-page";
import { isReservedHandle } from "@/lib/handles";
import { absoluteUrl } from "@/lib/seo";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const publicProfilePages = await db
    .select({
      handle: profilePages.handle,
      updatedAt: profilePages.updatedAt,
    })
    .from(profilePages);

  // Static pages
  const staticPageRoutes = ["", "/leaderboard", "/changelog", "/roadmap"] as const;

  const staticPages = staticPageRoutes.map((route) => ({
    url: absoluteUrl(route === "" ? "/" : route),
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: route === "" ? 1 : 0.4,
  }));

  // Policy pages
  const policyPages = ["/privacy", "/terms", "/refund"].map((route) => ({
    url: absoluteUrl(route),
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  // Public profile pages
  const profilePagesForSitemap = publicProfilePages
    .filter((page) => !isReservedHandle(page.handle))
    .map((page) => ({
      url: absoluteUrl(`/${page.handle}`),
      lastModified: page.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.7,
    }));

  return [...staticPages, ...policyPages, ...profilePagesForSitemap];
}
