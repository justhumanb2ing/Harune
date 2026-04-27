import { AnalyticsScript } from "@/components/analytics/analytics-script";
import { absoluteUrl, seoConfig } from "@/lib/seo";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Providers from "./Providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

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
    images: [absoluteUrl(seoConfig.defaultOgImagePath)],
  },
  icons: {
    icon: "/assets/logo.jpeg",
    apple: "/assets/logo.jpeg",
  },
  verification: {
    google: "RgHBA8CyoOi7nfUueLvoheQFmwX7abnJM8LWPi584J8",
  },
  category: "website",
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
      className={`${inter.variable} ${inter.className} h-full`}
    >
      <head>
        <AnalyticsScript />
      </head>
      <body className="h-full bg-background antialiased">
        <Providers>
          <div className="relative h-full min-h-lvh">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
