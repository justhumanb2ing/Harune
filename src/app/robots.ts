import { absoluteUrl } from "@/lib/seo";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  // https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/sign-in",
        "/sign-up",
        "/login",
        "/join",
        "/post-sign-in",
        "/create",
        "/subscribe",
        "/*/app",
        "/*/app/",
        "/*/analytics",
        "/*/analytics/",
      ],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
