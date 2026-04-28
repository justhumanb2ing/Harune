import AnalyticsCardSection from "@/components/sections/analytics-card-section";
import HandleCardSection from "@/components/sections/handle-card-section";
import LiveCardSection from "@/components/sections/live-card-section";
import MainHeroSection from "@/components/sections/main-hero-section";
import { WebPageStructuredData } from "@/components/seo/structured-data";
import { Button } from "@/components/ui/button";
import { appConfig } from "@/lib/config";
import { createPageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import Link from "next/link";

const homepageTitle = "A Link in bio: One page, all of you.";
const homepageDescription = `Create a free ${appConfig.projectName} bio site to share your links, social profiles, and creator page in one place.`;

export const metadata: Metadata = createPageMetadata({
  path: "/",
  title: homepageTitle,
  description: homepageDescription,
  keywords: appConfig.keywords,
  imageAlt: `${appConfig.projectName} link in bio tool preview`,
});

export default function WebsiteHomepage() {
  return (
    <>
      <WebPageStructuredData name={homepageTitle} description={homepageDescription} path="/" />
      <main className="relative h-full">
        <MainHeroSection />
        <HandleCardSection />
        <AnalyticsCardSection />
        <LiveCardSection />
        <section className="h-[20rem] flex flex-col justify-center items-center">
          <div className="flex flex-col justify-center items-center gap-2">
            <Button
              nativeButton={false}
              size={"lg"}
              className={"brand-button h-12 min-w-60 max-w-68 text-lg py-8 rounded-xl font-bold!"}
              render={<Link href="/join">Get Started</Link>}
            />
            <p className="text-sm text-muted-foreground">Unique links are still available</p>
          </div>
        </section>
      </main>
    </>
  );
}
