"use client";

import { CurrentPageButton, useCurrentPageMeta } from "@/components/layout/current-page-button";
import { DeleteAccountDialog } from "@/components/sections/delete-account-dialog";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { AnimatePresence, MotionConfig, type Transition, motion } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";

const BOX_WIDTH = 288;
const COLLAPSED_HEIGHT = 56;
const EXPANDED_HEIGHT = 360;
const BOX_OFFSET = 24;
const BOX_RADIUS = 24;

const EMPHASIZED_EASE = [0.22, 1, 0.36, 1] as const;
const EXIT_EASE = [0.4, 0, 1, 1] as const;

const shellTransition: Transition = {
  type: "spring",
  stiffness: 320,
  damping: 30,
  mass: 0.9,
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
  const previousPathnameRef = useRef(pathname);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);
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
      const result = await authClient.deleteUser();

      if (result.error) {
        const message =
          result.error.message || "Account deletion failed. Please sign in again and retry.";

        toast.error(message);
        setIsDeletingAccount(false);
        return;
      }

      toast.success("Account deleted.");
      setIsDeleteDialogOpen(false);
      setIsExpanded(false);
      router.replace("/");
      router.refresh();
    } catch (error) {
      console.error("Account deletion failed:", error);
      toast.error("Account deletion failed. Please try again.");
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
    <MotionConfig transition={shellTransition}>
      <motion.div
        ref={containerRef}
        animate={{
          height: isExpanded ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT,
          borderRadius: BOX_RADIUS,
        }}
        className="fixed left-6 z-50 flex flex-col overflow-hidden border border-border/80 bg-background shadow-[0_20px_60px_rgba(15,23,42,0.12)]"
        style={{
          bottom: BOX_OFFSET,
          width: BOX_WIDTH,
          transformOrigin: "bottom left",
        }}
      >
        <motion.button
          type="button"
          aria-expanded={isExpanded}
          aria-controls="setting-box-panel"
          initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={panelTransition}
          className={`flex h-14 w-full flex-row items-center gap-3 px-3 text-left outline-none transition-colors hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/50 ${
            isExpanded ? "border-b border-border/60" : ""
          }`}
          onClick={() => setIsExpanded(true)}
        >
          <CurrentPageButton size="lg" />
          <div className="flex min-w-0 flex-col">
            <span className="text-sm truncate font-medium text-foreground">{pageName}</span>
            <span className="min-w-0 flex-1 truncate text-xs font-medium text-muted-foreground">
              {pageHandleLabel}
            </span>
          </div>
        </motion.button>

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
                className="mb-3 space-y-0 px-2 text-sm flex flex-col"
              >
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
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </MotionConfig>,
    document.body
  );
}
