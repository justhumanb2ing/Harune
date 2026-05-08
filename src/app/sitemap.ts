import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPageRoutes = [
    "",
    "/sign-in",
    "/sign-up",
    "/explore",
    "/changelog",
    "/roadmap",
  ] as const;

  return [
    ...staticPageRoutes.map((route) => ({
      url: absoluteUrl(route === "" ? "/" : route),
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: route === "" ? 1 : route === "/sign-in" || route === "/sign-up" ? 0.6 : 0.4,
    })),
    ...["/privacy", "/terms", "/refund"].map((route) => ({
      url: absoluteUrl(route),
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
