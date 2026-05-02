import type { Metadata } from "next";
import type React from "react";
import { Footer } from "@/components/website/footer";
import { seoConfig } from "@/lib/seo";

export const metadata: Metadata = {
  title: {
    template: `%s | ${seoConfig.siteName}`,
    default: seoConfig.siteName,
  },
  description: seoConfig.description,
};

function WebsiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <main className="flex-1 h-full">
        <div className="h-full">{children}</div>
      </main>
      <Footer />
    </div>
  );
}

export default WebsiteLayout;
