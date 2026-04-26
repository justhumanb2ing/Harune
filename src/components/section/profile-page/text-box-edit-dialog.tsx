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
import type { DraftTextBoxItem } from "@/lib/profile-page/types";

type TextBoxEditDialogProps = {
  onOpenChange: (open: boolean) => void;
  onTextBoxChange: (
    id: string,
    key: keyof Omit<DraftTextBoxItem, "blockPosition" | "id" | "position">,
    value: string
  ) => void;
  textBox: DraftTextBoxItem | null;
};

export function TextBoxEditDialog({
  onOpenChange,
  onTextBoxChange,
  textBox,
}: TextBoxEditDialogProps) {
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

        {textBox ? (
          <div className="min-w-0 space-y-0 p-2">
            <Input
              value={textBox.title}
              onChange={(event) => onTextBoxChange(textBox.id, "title", event.target.value)}
              placeholder="What do you want to write?"
              className="w-full min-w-0 max-w-full border-0 font-medium text-lg! focus-visible:ring-0"
            />
            <Textarea
              value={textBox.description ?? ""}
              onChange={(event) => onTextBoxChange(textBox.id, "description", event.target.value)}
              placeholder="Add description for detail"
              className="min-h-32 w-full min-w-0 max-h-64 max-w-full text-base! break-all resize-none overflow-x-hidden overflow-y-auto border-0 [field-sizing:fixed] [overflow-wrap:anywhere] focus-visible:ring-0"
            />
          </div>
        ) : null}
      </DialogPopup>
    </Dialog>
  );
}
