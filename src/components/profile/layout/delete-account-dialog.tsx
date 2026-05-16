"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DeleteAccountDialogProps = {
  disabled?: boolean;
  isDeleting: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  triggerClassName?: string;
};

export function DeleteAccountDialog({
  disabled,
  isDeleting,
  onConfirm,
  onOpenChange,
  open,
  triggerClassName,
}: DeleteAccountDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            disabled={disabled || isDeleting}
            className={cn(
              "flex h-16 w-full items-center justify-start gap-2 px-4 py-0 font-normal",
              triggerClassName
            )}
          >
            <span>Delete Account</span>
          </Button>
        }
      />
      <AlertDialogContent
        size="default"
        className="flex h-96 flex-col gap-4 rounded-[2.5rem] p-7 shadow-float"
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl font-bold tracking-tight">
            Leaving already?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-neutral-700 text-base">
            <p>It will remove your page permanently.</p>
            <p>This can't be undone.</p>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-auto justify-end! sm:flex-col-reverse">
          <AlertDialogCancel
            size="lg"
            variant="ghost"
            disabled={isDeleting}
            className="h-12 text-base font-semibold"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            type="button"
            size="lg"
            disabled={isDeleting}
            aria-busy={isDeleting}
            onClick={onConfirm}
            className="brand-error-button h-12 text-base font-semibold shadow-md"
          >
            {isDeleting ? "Deleting..." : "Delete Account"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
