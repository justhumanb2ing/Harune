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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type DeleteAccountDialogProps = {
  isDeleting: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  onPasswordChange: (password: string) => void;
  open: boolean;
  password: string;
};

export function DeleteAccountDialog({
  isDeleting,
  onConfirm,
  onOpenChange,
  onPasswordChange,
  open,
  password,
}: DeleteAccountDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            disabled={isDeleting}
            className="flex w-full items-center justify-start gap-2 px-4 py-6 font-normal"
          >
            <span>Delete Account</span>
          </Button>
        }
      />
      <AlertDialogContent size="default">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl font-semibold">Leaving already?</AlertDialogTitle>
          <AlertDialogDescription>
            It will remove your page permanently. This can't be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid gap-2">
          <Label htmlFor="delete-account-password">Password</Label>
          <Input
            id="delete-account-password"
            type="password"
            value={password}
            autoComplete="current-password"
            disabled={isDeleting}
            placeholder="Required for password accounts"
            onChange={(event) => onPasswordChange(event.target.value)}
          />
        </div>

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
