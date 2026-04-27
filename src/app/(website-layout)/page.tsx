import AnalyticsCardSection from "@/components/sections/analytics-card-section";
import HandleCardSection from "@/components/sections/handle-card-section";
import LiveCardSection from "@/components/sections/live-card-section";
import MainHeroSection from "@/components/sections/main-hero-section";
import { Button } from "@/components/ui/button";

export default function WebsiteHomepage() {
  return (
    <main className="relative h-full">
      <MainHeroSection />
      <HandleCardSection />
      <AnalyticsCardSection />
      <LiveCardSection />
      <section className="h-[20rem] flex flex-col justify-center items-center">
        <div className="flex flex-col justify-center items-center gap-2">
          <Button
            size={"lg"}
            className={"brand-button h-12 min-w-60 max-w-68 text-lg py-7 font-bold!"}
          >
            Get Started
          </Button>
          <p className="text-sm text-muted-foreground">Unique links are still available</p>
        </div>
      </section>
    </main>
  );
}
