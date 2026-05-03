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
import type { DraftTextBoxItem } from "@/lib/profile/types";

type TextEditDialogProps = {
  onOpenChange: (open: boolean) => void;
  onTextBoxChange: (
    id: string,
    key: keyof Omit<DraftTextBoxItem, "blockPosition" | "id" | "position">,
    value: string
  ) => void;
  textBox: DraftTextBoxItem | null;
};

export function TextEditDialog({ onOpenChange, onTextBoxChange, textBox }: TextEditDialogProps) {
  const isBelowLg = useIsBelowLg();

  const content = textBox ? (
    <div className="min-w-0 space-y-0 p-2">
      <Input
        value={textBox.title}
        onChange={(event) => onTextBoxChange(textBox.id, "title", event.target.value)}
        placeholder="What’s on your mind?"
        className="w-full min-w-0 max-w-full border-0 font-medium text-lg! focus-visible:ring-0 truncate"
      />
      <Textarea
        value={textBox.description ?? ""}
        onChange={(event) => onTextBoxChange(textBox.id, "description", event.target.value)}
        placeholder="Add more about this"
        className="min-h-32 w-full min-w-0 max-h-64 max-w-full text-base! break-all resize-none overflow-x-hidden overflow-y-auto border-0 [field-sizing:fixed] [overflow-wrap:anywhere] focus-visible:ring-0"
      />
    </div>
  ) : null;

  if (isBelowLg) {
    return (
      <Drawer open={Boolean(textBox)} onOpenChange={onOpenChange}>
        <DrawerContent aria-label="Edit text" className="max-h-[85vh] gap-0 rounded-t-2xl p-0 pt-1">
          <DrawerTitle className="sr-only">Edit text</DrawerTitle>
          <div className="grid grid-cols-3 items-center px-3 py-2">
            <DrawerClose asChild>
              <Button
                size={"lg"}
                variant={"outline"}
                className="h-10 justify-self-start shadow-sm font-semibold px-6 rounded-md text-base border-border/60"
              >
                Close
              </Button>
            </DrawerClose>
            <h2 className="justify-self-center text-xl font-medium">Edit</h2>
            <DrawerClose asChild>
              <Button
                size={"lg"}
                variant={"outline"}
                className="brand-success-button h-10 justify-self-end shadow-sm font-semibold px-6 rounded-md text-base border text-primary-foreground hover:text-primary-foreground"
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
    <Dialog open={Boolean(textBox)} onOpenChange={onOpenChange}>
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
                  size={"lg"}
                  variant={"outline"}
                  className="h-10 shadow-sm font-semibold px-6 rounded-md text-base border-border/60"
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
                  size={"lg"}
                  variant={"outline"}
                  className="brand-success-button h-10 shadow-sm font-semibold px-6 rounded-md text-base border text-primary-foreground hover:text-primary-foreground"
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
