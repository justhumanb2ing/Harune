import { absoluteUrl } from "@/lib/seo";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  // https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/app", "/profile", "/subscribe/"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
