"use client";

import { UserButton } from "@/components/layout/user-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

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
const EXPANDED_WIDTH = 184;

type AnchorRect = {
  top: number;
  left: number;
  height: number;
};

function isActiveRoute(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Sidebar() {
  const pathname = usePathname();
  const { profilePage, user } = useUser();
  const anchorRef = useRef<HTMLDivElement>(null);
  const previousPathnameRef = useRef(pathname);
  const [mounted, setMounted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [anchorRect, setAnchorRect] = useState<AnchorRect | null>(null);
  const currentNavItem = navItems.find(({ href }) => isActiveRoute(pathname, href)) ?? navItems[0];
  const pageName = profilePage?.name || user?.name || currentNavItem.label;
  const pageHandle = profilePage?.handle
    ? `${appConfig.url.replace(/^https?:\/\//, "")}/${profilePage.handle}`
    : `${appConfig.url.replace(/^https?:\/\//, "")}/unknown`;
  const pageImage = profilePage?.image || user?.image || undefined;
  const pageInitial = pageName.trim().charAt(0).toUpperCase() || "P";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (previousPathnameRef.current === pathname) {
      return;
    }

    previousPathnameRef.current = pathname;
    setIsExpanded(false);
  }, [pathname]);

  useEffect(() => {
    if (!mounted || !anchorRef.current) {
      return;
    }

    const updateAnchorRect = () => {
      const rect = anchorRef.current?.getBoundingClientRect();

      if (!rect) {
        return;
      }

      setAnchorRect({
        top: rect.top,
        left: rect.left,
        height: rect.height,
      });
    };

    updateAnchorRect();

    const resizeObserver = new ResizeObserver(updateAnchorRect);
    resizeObserver.observe(anchorRef.current);

    window.addEventListener("resize", updateAnchorRect);
    window.addEventListener("scroll", updateAnchorRect, true);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateAnchorRect);
      window.removeEventListener("scroll", updateAnchorRect, true);
    };
  }, [mounted]);

  return (
    <>
      <div
        ref={anchorRef}
        aria-hidden="true"
        className="h-full"
        style={{ width: COLLAPSED_WIDTH }}
      />

      {mounted && anchorRect
        ? createPortal(
            <>
              <AnimatePresence>
                {isExpanded ? (
                  <motion.button
                    key="sidebar-overlay"
                    type="button"
                    aria-label="Close sidebar"
                    className="fixed inset-0 z-50 bg-black/32 backdrop-blur-xs"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    onClick={() => setIsExpanded(false)}
                  />
                ) : null}
              </AnimatePresence>

              <motion.aside
                className="fixed z-[60]"
                style={{
                  top: anchorRect.top,
                  left: anchorRect.left,
                  height: anchorRect.height,
                }}
                initial={false}
                animate={{
                  width: isExpanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH,
                }}
                transition={{ type: "spring", stiffness: 380, damping: 36 }}
              >
                <div className="relative h-full w-full overflow-hidden rounded-[2rem] bg-background shadow-xs">
                  <div className="absolute inset-y-0 left-0 flex w-14 flex-col items-center py-5">
                    <motion.div
                      className="flex h-20 items-start justify-center"
                      animate={{
                        opacity: isExpanded ? 0 : 1,
                      }}
                      transition={{ duration: 0.16, ease: "easeOut" }}
                      style={{
                        pointerEvents: isExpanded ? "none" : "auto",
                      }}
                    >
                      <button
                        type="button"
                        className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                        onClick={() => setIsExpanded((prev) => !prev)}
                      >
                        <UserButton />
                      </button>
                    </motion.div>

                    <motion.nav
                      aria-label="Sidebar"
                      className="relative flex w-full flex-col gap-2"
                      animate={{
                        opacity: isExpanded ? 0 : 1,
                      }}
                      transition={{ duration: 0.16, ease: "easeOut" }}
                      style={{
                        pointerEvents: isExpanded ? "none" : "auto",
                      }}
                    >
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
                                onClick={() => setIsExpanded(false)}
                              />
                            }
                          >
                            {isActive ? (
                              <motion.span
                                layoutId="sidebar-active-border"
                                className="pointer-events-none absolute inset-y-2 left-0 z-10 w-px bg-black"
                                transition={{ type: "spring", stiffness: 420, damping: 34 }}
                              />
                            ) : null}
                            <Icon className="size-5" />
                          </Button>
                        );
                      })}
                    </motion.nav>
                  </div>

                  <AnimatePresence initial={false}>
                    {isExpanded ? (
                      <motion.div
                        key="sidebar-panel"
                        className="absolute inset-0 min-w-0"
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -12 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                      >
                        <div className="flex h-full flex-col bg-background">
                          <div className="relative px-4 pb-3 pt-2">
                            <button
                              type="button"
                              className="absolute left-4 top-2.5 text-[9px] font-bold uppercase tracking-[0.04em] text-foreground transition-colors hover:text-foreground/80"
                              onClick={() => setIsExpanded(false)}
                            >
                              Cancel
                            </button>
                            <p className="text-center text-[11px] font-medium text-foreground">
                              Settings
                            </p>
                          </div>

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
                                <span className="truncate text-[9px] text-muted-foreground">
                                  {pageHandle}
                                </span>
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
                            >
                              <CircleHelpIcon className="size-3.5 text-muted-foreground" />
                              <span>Support</span>
                            </Link>
                            <Link
                              href="/terms"
                              className="flex items-center gap-2 px-4 py-3 text-[10px] text-foreground transition-colors hover:bg-muted/40"
                            >
                              <ShieldIcon className="size-3.5 text-muted-foreground" />
                              <span>Terms of Use</span>
                            </Link>
                            <Link
                              href="/privacy"
                              className="flex items-center gap-2 px-4 py-3 text-[10px] text-foreground transition-colors hover:bg-muted/40"
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
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </motion.aside>
            </>,
            document.body
          )
        : null}
    </>
  );
}
