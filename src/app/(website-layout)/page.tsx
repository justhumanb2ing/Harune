import type { Metadata } from "next";
import { WebPageStructuredData } from "@/components/site-instrumentation/structured-data";
import { AppEntryCtaButton } from "@/components/website/app-entry-cta-button";
import HandleCardSection from "@/components/website/landing/handle-card-section";
import LiveCardSection from "@/components/website/landing/live-card-section";
import MainHeroSection from "@/components/website/landing/main-hero-section";
import { appConfig } from "@/lib/config";
import { createPageMetadata } from "@/lib/seo";
import DonateSection from "@/components/website/donate-section";

const homepageTitle = "Harune, A Link in bio: One page, all of you.";
const homepageDescription = `Create a free ${appConfig.projectName} page to share your links, social profiles in one place.`;

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
        <LiveCardSection />
        <HandleCardSection />
        {/*<AnalyticsCardSection />*/}
        {/*<DonateSection />*/}
        <section className="h-[20rem] flex flex-col justify-center items-center">
          <div className="flex flex-col justify-center items-center gap-2">
            <AppEntryCtaButton
              next="/"
              size="lg"
              className="brand-button h-12 min-w-60 max-w-68 rounded-xl py-8 text-lg font-bold!"
            >
              Get Started
            </AppEntryCtaButton>
            <p className="text-sm text-muted-foreground">Unique handles are still available</p>
          </div>
        </section>
      </main>
    </>
  );
}
