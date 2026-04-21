import { AnimatedGridPattern } from "@/components/magicui/animated-grid-pattern";
import { absoluteUrl, createPageMetadata, seoConfig } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { WebPageJsonLd } from "next-seo";
import WaitlistForm from "./waitlist-form";

export const metadata = createPageMetadata({
  path: "/join-waitlist",
  title: "Join Waitlist",
  description: "Join our waitlist to get early access to our platform.",
});

export default function JoinWaitlistPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden relative py-16 md:py-32">
      <AnimatedGridPattern
        numSquares={30}
        maxOpacity={0.1}
        duration={3}
        repeatDelay={1}
        className={cn(
          "mask-[radial-gradient(500px_circle_at_center,white,transparent)]",
          "inset-x-0 inset-y-[-30%] h-[150%] skew-y-12"
        )}
      />
      <WebPageJsonLd
        useAppDir
        id={absoluteUrl("/join-waitlist")}
        title="Join Waitlist"
        description="Join our waitlist to get early access to our platform."
        isAccessibleForFree={true}
        publisher={{
          "@type": "Organization",
          name: seoConfig.siteName,
          url: seoConfig.siteUrl,
        }}
      />
      <div className="container max-w-md px-6 z-50">
        <div className="bg-background">
          <div className="rounded-2xl bg-card border p-8 md:p-10 shadow-sm">
            <div className="mb-8 text-center">
              <h1 className="mb-4 text-3xl font-semibold md:text-4xl">Join Our Waitlist</h1>
              <p className="text-lg text-muted-foreground">
                Be among the first to experience our platform when we launch.
              </p>
            </div>
            <WaitlistForm />
          </div>
        </div>
      </div>
    </div>
  );
}
