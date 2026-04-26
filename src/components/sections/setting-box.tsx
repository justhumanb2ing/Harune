"use client";

import { CurrentPageButton, useCurrentPageMeta } from "@/components/layout/current-page-button";
import { ChangeHandleButton } from "@/components/section/profile-page/change-handle-button";
import { DeleteAccountDialog } from "@/components/sections/delete-account-dialog";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import useUser from "@/lib/users/useUser";
import { BoxIcon, ChartColumnBigIcon, PlusIcon } from "lucide-react";
import { AnimatePresence, MotionConfig, type Transition, motion } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";

const BOX_WIDTH = 220;
const COLLAPSED_HEIGHT = 56;
const EXPANDED_HEIGHT = 360;
const BOX_OFFSET = 24;
const BOX_RADIUS = 24;

const EMPHASIZED_EASE = [0.22, 1, 0.36, 1] as const;
const EXIT_EASE = [0.4, 0, 1, 1] as const;

const shellExpandTransition: Transition = {
  height: {
    type: "spring",
    stiffness: 420,
    damping: 22,
    mass: 0.78,
  },
  borderRadius: {
    type: "spring",
    stiffness: 420,
    damping: 22,
    mass: 0.78,
  },
  scale: {
    duration: 0.34,
    ease: EMPHASIZED_EASE,
    times: [0, 0.55, 1],
  },
  y: {
    duration: 0.34,
    ease: EMPHASIZED_EASE,
    times: [0, 0.55, 1],
  },
};

const shellCollapseTransition: Transition = {
  height: {
    type: "spring",
    stiffness: 500,
    damping: 34,
    mass: 0.85,
  },
  borderRadius: {
    type: "spring",
    stiffness: 500,
    damping: 34,
    mass: 0.85,
  },
  scale: {
    duration: 0.18,
    ease: EXIT_EASE,
  },
  y: {
    duration: 0.18,
    ease: EXIT_EASE,
  },
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

export default function SettingBox() {
  const pathname = usePathname();
  const router = useRouter();
  const { pageHandleLabel, pageName } = useCurrentPageMeta();
  const { profilePage } = useUser();
  const previousPathnameRef = useRef(pathname);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const isAnalyticsPath = profilePage?.handle
    ? pathname === `/${profilePage.handle}/analytics` ||
      pathname.startsWith(`/${profilePage.handle}/analytics/`)
    : pathname === "/analytics" || pathname.startsWith("/analytics/");
  const sectionToggleHref = profilePage?.handle ? `/${profilePage.handle}/app` : "/post-sign-in";
  const analyticsToggleHref = profilePage?.handle
    ? `/${profilePage.handle}/analytics`
    : "/post-sign-in";
  const toggleHref = isAnalyticsPath ? sectionToggleHref : analyticsToggleHref;
  const ToggleIcon = isAnalyticsPath ? BoxIcon : ChartColumnBigIcon;

  const handleSignOut = async () => {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);

    try {
      const result = await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            setIsExpanded(false);
            router.push("/sign-in");
            router.refresh();
          },
        },
      });

      if (result.error) {
        console.error("Sign out failed:", result.error);
        setIsSigningOut(false);
        return;
      }
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

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
      if (isDeleteDialogOpen) {
        return;
      }

      if (event.target instanceof Element && event.target.closest("[data-setting-box-popover]")) {
        return;
      }

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
  }, [isDeleteDialogOpen, isExpanded]);

  if (!isMounted) {
    return null;
  }

  return createPortal(
    <MotionConfig transition={shellExpandTransition}>
      <motion.div
        ref={containerRef}
        animate={{
          height: isExpanded ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT,
          borderRadius: BOX_RADIUS,
          scale: isExpanded ? [1, 1.018, 1] : 1,
          y: isExpanded ? [0, -3, 0] : 0,
        }}
        transition={isExpanded ? shellExpandTransition : shellCollapseTransition}
        className="fixed left-6 z-50 flex flex-col overflow-hidden bg-background shadow-float"
        // border border-border/80 shadow-[0_10px_45px_0px_rgba(15,23,42,0.12)]
        style={{
          bottom: BOX_OFFSET,
          width: BOX_WIDTH,
          transformOrigin: "bottom left",
        }}
      >
        <motion.div
          aria-expanded={isExpanded}
          initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={panelTransition}
          className={`flex h-14 w-full flex-row items-center gap-2 px-3 ${
            isExpanded ? "border-b border-border/60" : ""
          }`}
        >
          <button
            type="button"
            aria-expanded={isExpanded}
            aria-controls="setting-box-panel"
            className="flex min-w-0 flex-1 flex-row items-center gap-3 rounded-xl text-left outline-none transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/50"
            onClick={() => setIsExpanded((prev) => !prev)}
          >
            <CurrentPageButton size="lg" />
            <div className="flex min-w-0 flex-col">
              <span className="text-sm truncate font-medium text-foreground">{pageName}</span>
              <span className="min-w-0 flex-1 truncate text-xs font-medium text-muted-foreground">
                {pageHandleLabel}
              </span>
            </div>
          </button>
          <Button
            nativeButton={false}
            variant="ghost"
            size="icon-sm"
            className="rounded-full text-primary p-4 hover:bg-background"
            render={
              <Link
                href={toggleHref}
                aria-label={isAnalyticsPath ? "Go to Section" : "Go to Analytics"}
                onClick={(event) => event.stopPropagation()}
              >
                <ToggleIcon className="size-5 stroke-2" />
              </Link>
            }
          />
        </motion.div>

        <AnimatePresence initial={false} mode="sync">
          {isExpanded ? (
            <motion.div
              id="setting-box-panel"
              key="setting-box-expanded"
              initial={{ opacity: 0, y: 18, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{
                opacity: 0,
                y: 16,
                filter: "blur(8px)",
                transition: panelExitTransition,
              }}
              transition={panelTransition}
              className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background"
            >
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
                className="space-y-0 px-2 py-2 text-sm flex flex-col justify-between flex-1"
              >
                <div>
                  <Button
                    type="button"
                    variant={"ghost"}
                    className={"w-full py-6 font-normal justify-between px-4"}
                  >
                    <span>Create new page</span>
                    <PlusIcon className="size-4" />
                  </Button>
                  <ChangeHandleButton />
                </div>

                <aside>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={isSigningOut}
                    aria-busy={isSigningOut}
                    className="flex w-full items-center justify-start gap-2 px-4 py-6 font-normal"
                    onClick={handleSignOut}
                  >
                    <span>{isSigningOut ? "Logging Out..." : "Log Out"}</span>
                  </Button>
                  <DeleteAccountDialog
                    open={isDeleteDialogOpen}
                    onOpenChange={handleDeleteDialogOpenChange}
                    isDeleting={isDeletingAccount}
                    onConfirm={handleDeleteAccount}
                  />
                </aside>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </MotionConfig>,
    document.body
  );
}
