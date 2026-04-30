import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  // https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/api/join",
        "/create",
        "/subscribe",
        "/v1/*/app",
        "/v1/*/app/",
        "/v1/*/analytics",
        "/v1/*/analytics/",
        "/*/app",
        "/*/app/",
        "/*/analytics",
        "/*/analytics/",
      ],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
