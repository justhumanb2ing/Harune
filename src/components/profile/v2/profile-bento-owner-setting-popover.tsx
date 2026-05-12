"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Settings2Icon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ChangeHandleButton } from "@/components/profile/editor-block/change-handle-button";
import { DeleteAccountDialog } from "@/components/profile/layout/delete-account-dialog";
import {
  Popover,
  PopoverPanel,
  PopoverTrigger,
} from "@/components/ui/animate-ui/components/base/popover";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getAppUrl } from "@/lib/auth/app-url";
import { authClient } from "@/lib/auth-client";
import { clearAuthenticatedAppQueries } from "@/lib/react-query/app-cache";

export function ProfileBentoOwnerSettingPopover() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const previousPathnameRef = useRef(pathname);
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
        callbackURL: getAppUrl("/sign-in"),
      });

      if (result.error) {
        const message =
          result.error.message || "Your session is no longer fresh Please sign in again and retry";

        toast.error(message);
        setIsDeletingAccount(false);
        return;
      }

      toast.success("Check your email to confirm account deletion");
      setIsDeleteDialogOpen(false);
      setIsOpen(false);
      setIsDeletingAccount(false);
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
    if (previousPathnameRef.current === pathname) {
      return;
    }

    previousPathnameRef.current = pathname;
    setIsOpen(false);
  }, [pathname]);

  return (
    <Tooltip>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger
          render={
            <TooltipTrigger
              render={
                <Button
                  aria-label="Settings"
                  type="button"
                  variant="ghost"
                  size={"icon-lg"}
                  className="border-0 bg-transparent text-neutral-500 shadow-none outline-none ring-0 hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-0"
                >
                  <Settings2Icon aria-hidden className="size-4" />
                </Button>
              }
            />
          }
        />
        <TooltipContent side="top" sideOffset={8}>
          Settings
        </TooltipContent>

        <PopoverPanel
          id="v2-owner-setting-popover"
          align="end"
          side="top"
          sideOffset={12}
          data-setting-box-popover=""
          className="w-52 overflow-hidden rounded-2xl border-border/40 bg-background p-2 shadow-brand-small!"
        >
          <div className="mb-10 flex flex-col gap-1">
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
              triggerClassName="h-16! rounded-md"
            />
          </div>

          <aside className="mt-1 space-y-1">
            <Button
              type="button"
              variant="ghost"
              disabled={isSigningOut}
              aria-busy={isSigningOut}
              className="h-16 w-full justify-start rounded-lg px-4 font-normal"
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
        </PopoverPanel>
      </Popover>
    </Tooltip>
  );
}
