"use client";

import { UserButton } from "@/components/layout/user-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { appConfig } from "@/lib/config";
import useUser from "@/lib/users/useUser";
import { cn } from "@/lib/utils";
import {
  BoxIcon,
  ChartColumnBigIcon,
  CheckIcon,
  CircleHelpIcon,
  LanguagesIcon,
  LogOutIcon,
  MoonStarIcon,
  PlusIcon,
  ShieldIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const navItems = [
  {
    href: "/section",
    label: "Section",
    icon: BoxIcon,
  },
  {
    href: "/analytics",
    label: "Analytics",
    icon: ChartColumnBigIcon,
  },
] as const;

const COLLAPSED_WIDTH = 72;
const SHEET_WIDTH = 184;

function isActiveRoute(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Sidebar() {
  const pathname = usePathname();
  const { profilePage, user } = useUser();
  const previousPathnameRef = useRef(pathname);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const currentNavItem = navItems.find(({ href }) => isActiveRoute(pathname, href)) ?? navItems[0];
  const pageName = profilePage?.name || user?.name || currentNavItem.label;
  const pageHandle = profilePage?.handle
    ? `${appConfig.url.replace(/^https?:\/\//, "")}/${profilePage.handle}`
    : `${appConfig.url.replace(/^https?:\/\//, "")}/unknown`;
  const pageImage = profilePage?.image || user?.image || undefined;
  const pageInitial = pageName.trim().charAt(0).toUpperCase() || "P";

  useEffect(() => {
    if (previousPathnameRef.current === pathname) {
      return;
    }

    previousPathnameRef.current = pathname;
    setIsSheetOpen(false);
  }, [pathname]);

  return (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <div
        className="flex h-full flex-col items-center overflow-hidden rounded-[2rem] bg-background py-5 shadow-xs"
        style={{ width: COLLAPSED_WIDTH }}
      >
        <div className="flex h-20 items-start justify-center">
          <button
            type="button"
            className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            onClick={() => setIsSheetOpen(true)}
          >
            <UserButton />
          </button>
        </div>

        <nav aria-label="Sidebar" className="relative flex w-full flex-col gap-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = isActiveRoute(pathname, href);

            return (
              <Button
                key={href}
                nativeButton={false}
                variant="ghost"
                size="icon-lg"
                className={cn(
                  "relative h-12 w-full overflow-visible transition-colors hover:bg-transparent",
                  isActive
                    ? "text-black hover:text-black"
                    : "text-muted-foreground hover:text-muted-foreground"
                )}
                render={
                  <Link
                    href={href}
                    aria-current={isActive ? "page" : undefined}
                    aria-label={label}
                    onClick={() => setIsSheetOpen(false)}
                  />
                }
              >
                {isActive ? (
                  <span className="pointer-events-none absolute inset-y-2 left-0 z-10 w-px bg-black" />
                ) : null}
                <Icon className="size-5" />
              </Button>
            );
          })}
        </nav>
      </div>

      <SheetContent
        side="left"
        variant="inset"
        showCloseButton={false}
        className="mt-2 h-[calc(100dvh-3rem)] w-auto max-w-none overflow-hidden rounded-[2rem] border-0 bg-background p-0 text-foreground shadow-xs"
        style={{ width: SHEET_WIDTH, maxWidth: SHEET_WIDTH }}
      >
        <div className="flex h-full flex-col">
          <SheetHeader className="relative gap-0 px-4 pb-3 pt-2">
            <SheetClose className="absolute left-4 top-2.5 text-[9px] font-bold uppercase tracking-[0.04em] text-foreground transition-colors hover:text-foreground/80">
              Cancel
            </SheetClose>
            <SheetTitle className="text-center text-[11px] font-medium text-foreground">
              Settings
            </SheetTitle>
            <SheetDescription className="sr-only">
              Profile, appearance, support, and account settings.
            </SheetDescription>
          </SheetHeader>

          <div className="border-t border-border/60">
            <div className="flex items-center gap-2 px-4 py-3">
              <Avatar size="default">
                <AvatarImage src={pageImage} alt={pageName} />
                <AvatarFallback>{pageInitial}</AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-[11px] font-medium uppercase text-foreground">
                  {pageName}
                </span>
                <span className="truncate text-[9px] text-muted-foreground">{pageHandle}</span>
              </div>
              <CheckIcon className="ml-auto size-3.5 text-foreground" />
            </div>
          </div>

          <button
            type="button"
            className="flex items-center border-t border-border/60 px-4 py-3 text-[10px] text-foreground"
          >
            <span>Create New Site</span>
            <PlusIcon className="ml-auto size-3.5" />
          </button>

          <div className="flex-1" />

          <div className="border-t border-border/60">
            <div className="flex items-center gap-2 px-4 py-3 text-[10px] text-foreground">
              <LanguagesIcon className="size-3.5 text-muted-foreground" />
              <span>Language</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-3 text-[10px] text-foreground">
              <MoonStarIcon className="size-3.5 text-muted-foreground" />
              <span>Dark Mode</span>
              <Switch
                size="sm"
                checked={isDarkMode}
                onCheckedChange={(checked) => setIsDarkMode(Boolean(checked))}
                className="ml-auto"
              />
            </div>
            <Link
              href={`mailto:${appConfig.legal.email}`}
              className="flex items-center gap-2 px-4 py-3 text-[10px] text-foreground transition-colors hover:bg-muted/40"
              onClick={() => setIsSheetOpen(false)}
            >
              <CircleHelpIcon className="size-3.5 text-muted-foreground" />
              <span>Support</span>
            </Link>
            <Link
              href="/terms"
              className="flex items-center gap-2 px-4 py-3 text-[10px] text-foreground transition-colors hover:bg-muted/40"
              onClick={() => setIsSheetOpen(false)}
            >
              <ShieldIcon className="size-3.5 text-muted-foreground" />
              <span>Terms of Use</span>
            </Link>
            <Link
              href="/privacy"
              className="flex items-center gap-2 px-4 py-3 text-[10px] text-foreground transition-colors hover:bg-muted/40"
              onClick={() => setIsSheetOpen(false)}
            >
              <ShieldIcon className="size-3.5 text-muted-foreground" />
              <span>Privacy Policy</span>
            </Link>
            <button
              type="button"
              className="flex w-full items-center gap-2 px-4 py-3 text-[10px] text-[#ff7a7a] transition-colors hover:bg-muted/40"
            >
              <LogOutIcon className="size-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
