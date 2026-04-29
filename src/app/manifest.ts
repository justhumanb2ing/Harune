import type { MetadataRoute } from "next";
import { appConfig } from "@/lib/config";
import { seoConfig } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: appConfig.projectName,
    short_name: appConfig.projectName,
    description: appConfig.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      {
        src: "/icon.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
    id: seoConfig.siteUrl,
  };
}
