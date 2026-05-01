"use client";

import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, MotionConfig, motion, type Transition } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ChangeHandleButton } from "@/components/profile-page/editor-block/change-handle-button";
import { DeleteAccountDialog } from "@/components/profile-page/layout/delete-account-dialog";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { clearAuthenticatedAppQueries } from "@/lib/react-query/app-cache";

const EMPHASIZED_EASE = [0.22, 1, 0.36, 1] as const;
const EXIT_EASE = [0.4, 0, 1, 1] as const;

const popoverTransition: Transition = {
  duration: 0.28,
  ease: EMPHASIZED_EASE,
};

const popoverExitTransition: Transition = {
  duration: 0.16,
  ease: EXIT_EASE,
};

export function ProfileBentoOwnerSettingPopover() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const previousPathnameRef = useRef(pathname);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);

    try {
      const result = await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            clearAuthenticatedAppQueries(queryClient);
            setIsOpen(false);
            router.push("/sign-in");
            router.refresh();
          },
        },
      });

      if (result.error) {
        console.error("Sign out failed:", result.error);
        setIsSigningOut(false);
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
      clearAuthenticatedAppQueries(queryClient);
      setIsDeleteDialogOpen(false);
      setIsOpen(false);
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
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
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
        setIsOpen(false);
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
  }, [isDeleteDialogOpen, isOpen]);

  useEffect(() => {
    if (previousPathnameRef.current === pathname) {
      return;
    }

    previousPathnameRef.current = pathname;
    setIsOpen(false);
  }, [pathname]);

  return (
    <MotionConfig transition={popoverTransition}>
      <div ref={containerRef} className="relative">
        <Button
          type="button"
          variant="ghost"
          className="px-2 font-normal"
          aria-expanded={isOpen}
          aria-controls="v2-owner-setting-popover"
          onClick={() => setIsOpen((current) => !current)}
        >
          setting
        </Button>

        <AnimatePresence initial={false}>
          {isOpen ? (
            <motion.div
              id="v2-owner-setting-popover"
              key="v2-owner-setting-popover"
              initial={{ opacity: 0, y: 12, scale: 0.96, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, scale: [1, 1.018, 1], filter: "blur(0px)" }}
              exit={{
                opacity: 0,
                y: 10,
                scale: 0.98,
                filter: "blur(6px)",
                transition: popoverExitTransition,
              }}
              className="-translate-x-1/2 absolute bottom-full left-1/2 mb-3 w-52 origin-bottom overflow-hidden rounded-2xl bg-background shadow-brand-small border border-border/40 p-2 xl:left-0 xl:translate-x-0 xl:origin-bottom-left"
            >
              <div className="space-y-1 mb-10">
                <Button
                  variant="ghost"
                  className="h-16 w-full flex-col items-start gap-1 rounded-lg px-4 font-normal text-muted-foreground hover:bg-transparent hover:text-muted-foreground"
                  disabled
                >
                  <span>Create page</span>
                  <span className="text-xs">(coming soon)</span>
                </Button>
                <ChangeHandleButton
                  panelAlign="end"
                  panelCollisionAvoidance={{
                    align: "none",
                    fallbackAxisSide: "none",
                    side: "none",
                  }}
                  panelSideOffset={12}
                  triggerClassName="h-11 rounded-md py-0 active:!translate-y-0"
                />
              </div>

              <aside className="mt-1 space-y-1">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={isSigningOut}
                  aria-busy={isSigningOut}
                  className="h-11 w-full justify-start rounded-lg px-4 font-normal"
                  onClick={handleSignOut}
                >
                  <span>{isSigningOut ? "Logging Out..." : "Log Out"}</span>
                </Button>
                <DeleteAccountDialog
                  open={isDeleteDialogOpen}
                  onOpenChange={handleDeleteDialogOpenChange}
                  disabled
                  isDeleting={isDeletingAccount}
                  onConfirm={handleDeleteAccount}
                  triggerClassName="h-11 min-h-0 rounded-lg py-0 hover:bg-transparent hover:text-muted-foreground"
                />
              </aside>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
