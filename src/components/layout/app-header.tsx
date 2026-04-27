"use client";

import { CurrentPageButton } from "@/components/layout/current-page-button";
import { appConfig } from "@/lib/config";
import useUser from "@/lib/users/useUser";
import Link from "next/link";

export function AppHeader() {
  const { profilePage } = useUser();
  const sectionHref = profilePage?.handle ? `/${profilePage.handle}/app` : "/post-sign-in";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-xs supports-backdrop-filter:bg-background/60">
      <div className="mx-auto max-w-(--breakpoint-xl) px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              href={sectionHref}
              prefetch={profilePage?.handle ? undefined : false}
              className="flex items-center space-x-2"
            >
              <span className="text-lg font-bold">{appConfig.projectName}</span>
            </Link>
          </div>

          <CurrentPageButton />
        </div>
      </div>
    </header>
  );
}
