import LeaderboardSection from "@/components/sections/leaderboard-section";
import { appConfig } from "@/lib/config";
import { createPageMetadata } from "@/lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = createPageMetadata({
  path: "/leaderboard",
  title: "Leaderboard",
  description: `Discover top ${appConfig.projectName} creator pages and see which public profiles are leading the community.`,
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
    <main className="relative h-dvh min-h-dvh">
      <LeaderboardSection />
    </main>
  );
}
