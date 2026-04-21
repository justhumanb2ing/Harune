import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { seoConfig } from "@/lib/seo";
import type { Metadata } from "next";
import type React from "react";

export const metadata: Metadata = {
  title: {
    template: `%s | ${seoConfig.siteName}`,
    default: seoConfig.siteName,
  },
  description: seoConfig.description,
};

function WebsiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-(--breakpoint-xl) px-2 sm:px-4 lg:px-6">{children}</div>
      </main>
      <Footer />
    </div>
  );
}

export default WebsiteLayout;
