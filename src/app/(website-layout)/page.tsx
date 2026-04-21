import Hero2 from "@/components/sections/hero-2";
import TextRevealByWord from "@/components/ui/text-reveal";
import CTA1 from "@/components/website/cta-1";
import { CTA2 } from "@/components/website/cta-2";
import { WebsiteFAQs } from "@/components/website/faqs";
import MonthlyAnnualPricing from "@/components/website/monthly-annual-pricing";
import { WithWithout } from "@/components/website/with-without";

export default function WebsiteHomepage() {
  return (
    <>
      <Hero2 />
      <CTA1 />
      <MonthlyAnnualPricing />
      <TextRevealByWord text="Your compelling testimonial or value prop here" />
      <WithWithout />
      <WebsiteFAQs />
      <CTA2 />
    </>
  );
}
