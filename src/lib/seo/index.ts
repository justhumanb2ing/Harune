import { env } from "@/env";
import { appConfig } from "@/lib/config";
import type { Metadata } from "next";

const FALLBACK_SITE_URL = appConfig.url;
const defaultSiteUrl = (env.NEXT_PUBLIC_APP_URL ?? FALLBACK_SITE_URL).replace(/\/$/, "");

type PublicPath = `/${string}` | "/";

export const seoConfig = {
  siteName: appConfig.projectName,
  siteUrl: defaultSiteUrl,
  description: appConfig.description,
  keywords: appConfig.keywords,
  locale: "en_US",
  defaultOgImagePath: "/images/og.png" as PublicPath,
} as const;

export const absoluteUrl = (path = "/") => new URL(path, `${seoConfig.siteUrl}/`).toString();

export type PageMetadataOptions = {
  path: string;
  title: string;
  description: string;
  type?: "website" | "article";
  keywords?: string[];
  imagePath?: string;
  imageAlt?: string;
};

export const createPageMetadata = ({
  path,
  title,
  description,
  type = "website",
  keywords,
  imagePath = seoConfig.defaultOgImagePath,
  imageAlt = title,
}: PageMetadataOptions): Metadata => {
  const canonicalUrl = absoluteUrl(path);
  const ogImageUrl = absoluteUrl(imagePath);

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      type,
      url: canonicalUrl,
      siteName: seoConfig.siteName,
      locale: seoConfig.locale,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: imageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
};
