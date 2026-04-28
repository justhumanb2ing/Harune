import type { Metadata } from "next";
import {
  BreadcrumbJsonLd,
  WebPageStructuredData,
} from "@/components/site-instrumentation/structured-data";
import LeaderboardSection from "@/components/website/leaderboard-section";
import { appConfig } from "@/lib/config";
import { createPageMetadata } from "@/lib/seo";

const leaderboardDescription = `Discover top ${appConfig.projectName} creator pages and see which public profiles are leading the community.`;

export const metadata: Metadata = createPageMetadata({
  path: "/leaderboard",
  title: "Leaderboard",
  description: leaderboardDescription,
  keywords: [
    ...appConfig.keywords,
    `${appConfig.projectName} leaderboard`,
    "creator leaderboard",
    "profile leaderboard",
    "top creator pages",
    "top profile pages",
  ],
  imageAlt: `${appConfig.projectName} leaderboard preview`,
});

export default function LeaderboardPage() {
  return (
    <>
      <WebPageStructuredData
        name="Leaderboard"
        description={leaderboardDescription}
        path="/leaderboard"
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Leaderboard", path: "/leaderboard" },
        ]}
      />
      <main className="relative h-dvh min-h-dvh">
        <LeaderboardSection />
      </main>
    </>
  );
}
