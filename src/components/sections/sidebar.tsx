"use client";

import { CurrentPageButton, useCurrentPageMeta } from "@/components/layout/current-page-button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { clearAuthenticatedAppQueries } from "@/lib/react-query/app-cache";
import useUser from "@/lib/users/useUser";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangleIcon,
  BoxIcon,
  ChartColumnBigIcon,
  DotIcon,
  LogOutIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { AnimatePresence, LayoutGroup, MotionConfig, type Transition, motion } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const navItems = [
  {
    getHref: (handle?: string) => (handle ? `/${handle}/app` : "/join"),
    label: "Section",
    icon: BoxIcon,
  },
  {
    getHref: (handle?: string) => (handle ? `/${handle}/analytics` : "/join"),
    label: "Analytics",
    icon: ChartColumnBigIcon,
  },
] as const;

const COLLAPSED_WIDTH = 60;
const EXPANDED_WIDTH = 288;
const COLLAPSED_RADIUS = 12;
const EXPANDED_RADIUS = 12;

const EMPHASIZED_EASE = [0.22, 1, 0.36, 1] as const;
const EXIT_EASE = [0.4, 0, 1, 1] as const;

const shellTransition: Transition = {
  type: "spring",
  stiffness: 320,
  damping: 30,
  mass: 0.9,
};

const activeIndicatorTransition: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 34,
  mass: 0.7,
};

const railTransition: Transition = {
  duration: 0.24,
  ease: EMPHASIZED_EASE,
};

const railExitTransition: Transition = {
  duration: 0.18,
  ease: EXIT_EASE,
};

const panelTransition: Transition = {
  delay: 0.06,
  duration: 0.28,
  ease: EMPHASIZED_EASE,
};

const panelExitTransition: Transition = {
  duration: 0.16,
  ease: EXIT_EASE,
};

function panelItemTransition(index: number): Transition {
  return {
    delay: 0.1 + index * 0.045,
    duration: 0.24,
    ease: EMPHASIZED_EASE,
  };
}

function panelItemExitTransition(index: number): Transition {
  return {
    delay: (3 - index) * 0.025,
    duration: 0.14,
    ease: EXIT_EASE,
  };
}

function isActiveRoute(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { pageHandleLabel, pageImage, pageName } = useCurrentPageMeta();
  const { profilePage } = useUser();
  const previousPathnameRef = useRef(pathname);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);

    try {
      const result = await authClient.signOut();

      if (result.error) {
        console.error("Sign out failed:", result.error);
        setIsSigningOut(false);
        return;
      }

      clearAuthenticatedAppQueries(queryClient);
      setIsExpanded(false);
      router.push("/sign-in");
      router.refresh();
    } catch (error) {
      console.error("Sign out failed:", error);
      setIsSigningOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (isDeletingAccount) {
      return;
    }

    setIsDeletingAccount(true);

    try {
      const result = await authClient.deleteUser({
        callbackURL: "/sign-in",
      });

      if (result.error) {
        const message =
          result.error.message || "Your session is no longer fresh Please sign in again and retry";

        toast.error(message.replace(/\./g, ""));
        setIsDeletingAccount(false);
        return;
      }

      toast.success("Account deleted");
      clearAuthenticatedAppQueries(queryClient);
      setIsDeleteDialogOpen(false);
      setIsExpanded(false);
      router.replace("/sign-in");
      router.refresh();
    } catch (error) {
      console.error("Account deletion failed:", error);
      toast.error("Account deletion failed Please try again");
      setIsDeletingAccount(false);
    }
  };

  const handleDeleteDialogOpenChange = (open: boolean) => {
    if (isDeletingAccount) {
      return;
    }

    setIsDeleteDialogOpen(open);
  };

  const prefetchAppRoute = (href: string) => {
    if (href === "/join") {
      return;
    }

    router.prefetch(href);
  };

  useEffect(() => {
    if (previousPathnameRef.current === pathname) {
      return;
    }

    previousPathnameRef.current = pathname;
    setIsExpanded(false);
  }, [pathname]);

  useEffect(() => {
    if (!isExpanded) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsExpanded(false);
      }
    };

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [isExpanded]);

  return (
    <MotionConfig transition={shellTransition}>
      <div className="relative h-full" style={{ width: COLLAPSED_WIDTH }}>
        <AnimatePresence>
          {isExpanded ? (
            <motion.button
              key="sidebar-overlay"
              aria-label="Close settings panel"
              type="button"
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsExpanded(false)}
            />
          ) : null}
        </AnimatePresence>

        <motion.div
          ref={containerRef}
          animate={{
            width: isExpanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH,
            borderRadius: isExpanded ? EXPANDED_RADIUS : COLLAPSED_RADIUS,
          }}
          className="absolute left-0 top-0 z-50 flex h-full overflow-hidden bg-background shadow-[0_20px_60px_rgba(15,23,42,0.08)] supports-backdrop-filter:backdrop-blur-xl"
        >
          <AnimatePresence initial={false} mode="sync">
            {!isExpanded ? (
              <motion.div
                key="sidebar-collapsed"
                initial={{ opacity: 0, x: -12, filter: "blur(4px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{
                  opacity: 0,
                  x: -22,
                  filter: "blur(6px)",
                  transition: railExitTransition,
                }}
                transition={railTransition}
                className="absolute inset-0 flex flex-col items-center py-3"
              >
                <div className="flex h-20 items-start justify-center">
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    aria-controls="sidebar-settings-panel"
                    className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                    onClick={() => setIsExpanded((open) => !open)}
                  >
                    <CurrentPageButton />
                  </button>
                </div>

                <LayoutGroup id="sidebar-nav">
                  <nav aria-label="Sidebar" className="relative flex w-full flex-col gap-2">
                    {navItems.map(({ getHref, label, icon: Icon }) => {
                      const href = getHref(profilePage?.handle);
                      const isActive = isActiveRoute(pathname, href);

                      return (
                        <Button
                          key={label}
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
                              prefetch={href === "/join" ? false : undefined}
                              aria-current={isActive ? "page" : undefined}
                              aria-label={label}
                              onFocus={() => prefetchAppRoute(href)}
                              onMouseEnter={() => prefetchAppRoute(href)}
                              onClick={() => setIsExpanded(false)}
                            />
                          }
                        >
                          {isActive ? (
                            <motion.span
                              layoutId="sidebar-active-indicator"
                              className="pointer-events-none absolute inset-y-1 -left-0.5 z-10 w-[3px] rounded-full bg-black"
                              transition={activeIndicatorTransition}
                            />
                          ) : null}
                          <Icon className="size-5" />
                        </Button>
                      );
                    })}
                  </nav>
                </LayoutGroup>
              </motion.div>
            ) : (
              <motion.div
                id="sidebar-settings-panel"
                key="sidebar-expanded"
                initial={{ opacity: 0, x: 18, filter: "blur(10px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{
                  opacity: 0,
                  x: 16,
                  filter: "blur(8px)",
                  transition: panelExitTransition,
                }}
                transition={panelTransition}
                className="absolute inset-0 z-10 flex flex-col overflow-hidden"
              >
                <div className="flex h-full w-full flex-col bg-background gap-0">
                  <motion.div
                    initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{
                      opacity: 0,
                      y: 8,
                      filter: "blur(6px)",
                      transition: panelItemExitTransition(0),
                    }}
                    transition={panelItemTransition(0)}
                    className="flex items-center justify-between px-2 py-2 border-b border-border/60"
                  >
                    <div className="flex-1">
                      <button
                        type="button"
                        aria-label="Close settings"
                        className="p-1"
                        onClick={() => setIsExpanded(false)}
                      >
                        <XIcon className="size-3.5" />
                      </button>
                    </div>
                    <div className="flex flex-col flex-1 text-center">
                      <span className="text-xs font-medium text-foreground uppercase">
                        Settings
                      </span>
                    </div>
                    <div className="flex-1" />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{
                      opacity: 0,
                      y: 8,
                      filter: "blur(6px)",
                      transition: panelItemExitTransition(1),
                    }}
                    transition={panelItemTransition(1)}
                    className="py-4 border-b border-border/60"
                  >
                    <div className="flex items-center gap-4 px-4">
                      <Avatar size="lg">
                        <AvatarImage src={pageImage} alt={pageName} />
                        <AvatarFallback />
                      </Avatar>
                      <div className="flex min-w-0 flex-col text-sm">
                        <span className="truncate font-medium uppercase text-foreground">
                          {pageName}
                        </span>
                        <span className="text-xs truncate text-muted-foreground">
                          {pageHandleLabel}
                        </span>
                      </div>
                      <DotIcon className="ml-auto size-4 stroke-8 text-green-500" />
                    </div>
                  </motion.div>

                  <div className="flex-1" />

                  <motion.div
                    initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{
                      opacity: 0,
                      y: 8,
                      filter: "blur(6px)",
                      transition: panelItemExitTransition(3),
                    }}
                    transition={panelItemTransition(3)}
                    className="mb-3 space-y-1 px-2 text-sm"
                  >
                    <AlertDialog
                      open={isDeleteDialogOpen}
                      onOpenChange={handleDeleteDialogOpenChange}
                    >
                      <AlertDialogTrigger
                        render={
                          <Button
                            type="button"
                            variant="ghost"
                            disabled={isDeletingAccount}
                            className="flex w-full items-center justify-start gap-2 px-4 py-5 text-destructive hover:text-destructive/80"
                          >
                            <Trash2Icon className="size-3.5" />
                            <span>Delete Account</span>
                          </Button>
                        }
                      />
                      <AlertDialogContent size="default">
                        <AlertDialogHeader>
                          <AlertDialogMedia className="bg-destructive/10 text-destructive">
                            <AlertTriangleIcon className="size-5" />
                          </AlertDialogMedia>
                          <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This permanently deletes your account, profile page, links, analytics
                            credits, and active sessions. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>

                        <p className="text-sm text-muted-foreground">
                          You may need to sign in again before deleting your account.
                        </p>

                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={isDeletingAccount}>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            type="button"
                            variant="destructive"
                            disabled={isDeletingAccount}
                            aria-busy={isDeletingAccount}
                            onClick={handleDeleteAccount}
                          >
                            {isDeletingAccount ? "Deleting..." : "Delete Account"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <Button
                      type="button"
                      variant={"ghost"}
                      disabled={isSigningOut}
                      aria-busy={isSigningOut}
                      className="flex w-full items-center justify-start gap-2 px-4 py-5 text-destructive hover:text-destructive/80"
                      onClick={handleSignOut}
                    >
                      <LogOutIcon className="size-3.5" />
                      <span>{isSigningOut ? "Logging Out..." : "Log Out"}</span>
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </MotionConfig>
  );
}
