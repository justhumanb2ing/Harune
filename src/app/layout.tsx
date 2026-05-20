import type { Metadata } from "next";
import { AnalyticsScript } from "@/components/site-instrumentation/analytics-script";
import { SiteStructuredData } from "@/components/site-instrumentation/structured-data";
import { inter, pretendard } from "@/lib/fonts";
import { absoluteUrl, seoConfig } from "@/lib/seo";
import Providers from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(seoConfig.siteUrl),
  title: {
    template: `%s | ${seoConfig.siteName}`,
    default: seoConfig.siteName,
  },
  description: seoConfig.description,
  keywords: seoConfig.keywords,
  alternates: {
    canonical: seoConfig.siteUrl,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: seoConfig.siteName,
    description: seoConfig.description,
    url: seoConfig.siteUrl,
    siteName: seoConfig.siteName,
    locale: seoConfig.locale,
    type: "website",
    images: [
      {
        url: absoluteUrl(seoConfig.defaultOgImagePath),
        width: 1200,
        height: 630,
        alt: seoConfig.siteName,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: seoConfig.siteName,
    description: seoConfig.description,
    images: [absoluteUrl(seoConfig.defaultTwitterImagePath)],
  },
  verification: {
    google: "RgHBA8CyoOi7nfUueLvoheQFmwX7abnJM8LWPi584J8",
  },
  category: "website",
  applicationName: seoConfig.siteName,
  publisher: seoConfig.siteName,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${pretendard.variable} ${inter.variable} h-full`}
    >
      <head>
        <AnalyticsScript />
        <SiteStructuredData />
      </head>
      <body className="h-full bg-background font-sans antialiased">
        <Providers>
          <div className="relative h-full min-h-lvh">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
