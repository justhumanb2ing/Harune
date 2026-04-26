"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { ChevronLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const sectionIndex = segments.indexOf("section");
  const sectionPath =
    sectionIndex === -1
      ? "/section"
      : `/${segments.slice(0, sectionIndex + 1).join("/")}`;

  return (
    <main className="h-full px-4 py-10 sm:px-0">
      <div className="space-y-6 pb-4">
        <div>
          <Button
            nativeButton={false}
            size={"lg"}
            className={'w-full h-12 text-base! brand-button font-bold'}
            render={
              <Link
                href={sectionPath}
                className="flex items-center gap-1"
              >
                <ChevronLeftIcon className="size-5 stroke-3" />
                <span>{title}</span>
              </Link>
            }
          />
        </div>
        {children}
      </div>
    </main>
  );
}
