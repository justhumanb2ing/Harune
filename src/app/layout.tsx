import type { Metadata } from "next";
import { Geist, Inter } from "next/font/google";
import "./globals.css";
import { AnalyticsScript } from "@/components/analytics/analytics-script";
import { absoluteUrl, seoConfig } from "@/lib/seo";
import { cn } from "@/lib/utils";
import Providers from "./Providers";
import { Toaster } from "@/components/ui/sonner";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("h-full font-sans", geist.variable)}>
      <head>
        {/* For Google Search Console */}
        <meta name="google-site-verification" content="YOUR_VERIFICATION_CODE_HERE" />
        <AnalyticsScript />
      </head>
      <body className={`${inter.variable} h-full min-h-screen antialiased bg-background`}>
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
