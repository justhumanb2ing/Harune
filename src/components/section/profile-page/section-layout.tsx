import Link from "next/link";
import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeftIcon } from "lucide-react";

type ProfilePageSectionLayoutProps = {
  children?: ReactNode;
  description: string;
  hasData: boolean;
  isLoading: boolean;
  title: string;
};

export function ProfilePageSectionLayout({
  children,
  description,
  hasData,
  isLoading,
  title,
}: ProfilePageSectionLayoutProps) {
  return (
    <main className="space-y-6">
      <div className="space-y-3">
        <Link
          href="/section"
          className="flex items-center gap-1 text-sm transition-colors hover:text-foreground"
        >
          <ChevronLeftIcon className="size-4"/>
          <span>{title}</span>
        </Link>
      </div>
      {children}
    </main>
  );
}
