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

type DeleteAccountDialogProps = {
  isDeleting: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function DeleteAccountDialog({
  isDeleting,
  onConfirm,
  onOpenChange,
  open,
}: DeleteAccountDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            disabled={isDeleting}
            className="flex w-full items-center justify-start gap-2 px-4 py-6 font-normal text-muted-foreground"
          >
            <span>Delete Account</span>
          </Button>
        }
      />
      <AlertDialogContent size="default" className="gap-4">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-semibold">Leaving already?</AlertDialogTitle>
          <AlertDialogDescription>
            It will remove your page permanently. This can't be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="sm:flex-col-reverse">
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
