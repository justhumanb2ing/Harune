"use client";

import {
  Dialog,
  DialogClose,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/animate-ui/components/base/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { DraftLinkItem } from "@/lib/profile-page/types";

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
  return (
    <Dialog open={Boolean(link)} onOpenChange={onOpenChange}>
      <DialogPopup
        showCloseButton={false}
        className="z-50 max-w-md gap-0 rounded-2xl border-0 p-0 pt-1 sm:max-w-md"
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
                  className="h-10 rounded-md border border-green-400 bg-green-400 px-6 font-semibold text-base text-primary-foreground shadow-sm hover:bg-green-500 hover:text-primary-foreground"
                >
                  Save
                </Button>
              }
            />
          </div>
        </DialogHeader>

        {link ? (
          <div className="space-y-0 p-2">
            <Input
              value={link.title}
              onChange={(event) => onLinkItemChange(link.id, "title", event.target.value)}
              placeholder="What do you want to show?"
              className="border-0 font-medium text-base! focus-visible:ring-0"
            />
            <Textarea
              value={link.description ?? ""}
              onChange={(event) => onLinkItemChange(link.id, "description", event.target.value)}
              placeholder="Add description for detail"
              className="min-h-32 resize-none break-all border-0 focus-visible:ring-0"
            />
          </div>
        ) : null}
      </DialogPopup>
    </Dialog>
  );
}
