"use client";

import {
  Dialog,
  DialogClose,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/animate-ui/components/base/dialog";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useIsBelowLg } from "@/hooks/use-mobile";
import type { DraftLinkItem } from "@/lib/profile/types";

type LinkEditDialogProps = {
  link: DraftLinkItem | null;
  onLinkItemChange: (
    id: string,
    key: keyof Omit<DraftLinkItem, "id" | "position">,
    value: string
  ) => void;
  onOpenChange: (open: boolean) => void;
};

export function LinkEditDialog({ link, onLinkItemChange, onOpenChange }: LinkEditDialogProps) {
  const isBelowLg = useIsBelowLg();
  const content = link ? (
    <div className="space-y-0 p-2">
      <Input
        value={link.title}
        onChange={(event) => onLinkItemChange(link.id, "title", event.target.value)}
        placeholder="What do you want to show?"
        className="border-0 font-medium text-lg! focus-visible:ring-0 truncate "
      />
      <Textarea
        value={link.description ?? ""}
        onChange={(event) => onLinkItemChange(link.id, "description", event.target.value)}
        placeholder="Add description for detail"
        className="min-h-32 resize-none break-all border-0 focus-visible:ring-0 text-base!"
      />
    </div>
  ) : null;

  if (isBelowLg) {
    return (
      <Drawer open={Boolean(link)} onOpenChange={onOpenChange}>
        <DrawerContent aria-label="Edit link" className="max-h-[85vh] gap-0 rounded-t-2xl p-0 pt-1">
          <DrawerTitle className="sr-only">Edit link</DrawerTitle>
          <div className="grid grid-cols-3 items-center px-3 py-2">
            <DrawerClose asChild>
              <Button
                size="lg"
                variant="outline"
                className="h-10 justify-self-start rounded-md border-border/60 px-6 font-semibold text-base shadow-sm"
              >
                Close
              </Button>
            </DrawerClose>
            <h2 className="justify-self-center text-xl font-medium">Edit</h2>
            <DrawerClose asChild>
              <Button
                size="lg"
                variant="outline"
                className="brand-success-button h-10 justify-self-end rounded-md border px-6 font-semibold text-base text-primary-foreground shadow-sm hover:text-primary-foreground"
              >
                Save
              </Button>
            </DrawerClose>
          </div>
          <div className="min-h-0 overflow-y-auto">{content}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={Boolean(link)} onOpenChange={onOpenChange}>
      <DialogPopup
        showCloseButton={false}
        className="z-50 max-w-sm gap-0 rounded-2xl border-0 p-0 pt-1 sm:max-w-sm"
      >
        <DialogHeader className="px-3 py-2">
          <div className="grid grid-cols-3 items-center">
            <DialogClose
              className="justify-self-start"
              render={
                <Button
                  size="lg"
                  variant="outline"
                  className="h-10 rounded-md border-border/60 px-6 font-semibold text-base shadow-sm"
                >
                  Close
                </Button>
              }
            />
            <DialogTitle className="justify-self-center text-xl">Edit</DialogTitle>
            <DialogClose
              className="justify-self-end"
              render={
                <Button
                  size="lg"
                  variant="outline"
                  className="brand-success-button h-10 rounded-md border px-6 font-semibold text-base text-primary-foreground shadow-sm hover:text-primary-foreground"
                >
                  Save
                </Button>
              }
            />
          </div>
        </DialogHeader>

        {content}
      </DialogPopup>
    </Dialog>
  );
}
