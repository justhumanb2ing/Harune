import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  // https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/create", "/*/app", "/*/app/", "/*/analytics", "/*/analytics/"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
