"use client";

import { DndContext, closestCenter } from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { XCircleIcon } from "@phosphor-icons/react";
import {
  CheckIcon,
  ChevronRightIcon,
  GripVertical,
  Loader2Icon,
  SparkleIcon,
  XIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import {
  Dialog,
  DialogClose,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/animate-ui/components/base/dialog";
import { SortableShell } from "@/components/section/profile-page/sortable-shell";
import { useProfilePageEditor } from "@/components/section/profile-page/use-profile-page-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Item, ItemActions, ItemContent, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Textarea } from "@/components/ui/textarea";

const pageEditorSections = [
  {
    href: "/section/profile",
    title: "Profile",
  },
  {
    href: "/section/social",
    title: "Social",
  },
];

const otherBlockSections = [
  {
    href: "/section/text-box",
    title: "Text",
  },
];

function SectionLinkItem({ href, title }: { href: string; title: string }) {
  return (
    <Item
      variant="default"
      render={
        <Link
          href={href}
          className="rounded-2xl bg-background py-3.5 shadow-brand transition-colors hover:bg-background!"
        >
          <ItemMedia>
            <SparkleIcon />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>{title}</ItemTitle>
          </ItemContent>
          <ItemActions>
            <Button size="icon-sm" variant="ghost" aria-label={`${title} 열기`}>
              <ChevronRightIcon />
            </Button>
          </ItemActions>
        </Link>
      }
    />
  );
}

export default function SectionPage() {
  const editor = useProfilePageEditor();
  const [selectedTextBoxId, setSelectedTextBoxId] = useState<string | null>(null);
  const selectedTextBox =
    editor.data?.textBoxItems.find((item) => item.id === selectedTextBoxId) ?? null;

  return (
    <main className="space-y-8">
      <section className="space-y-3">
        <p className="text-sm text-muted-foreground">Page editor</p>

        <div className="flex flex-col gap-2">
          {pageEditorSections.map((section) => (
            <SectionLinkItem key={section.href} href={section.href} title={section.title} />
          ))}

          {editor.isBooting || editor.isUserLoading ? (
            <div className="flex min-h-14 items-center justify-center rounded-2xl bg-background shadow-brand">
              <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
            </div>
          ) : editor.data ? (
            <DndContext
              sensors={editor.sensors}
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis, restrictToParentElement]}
              onDragEnd={(event) => void editor.handlePageBlockDragEnd(event)}
            >
              <SortableContext
                items={editor.pageEditorBlocks.map((block) => block.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col gap-2">
                  {editor.pageEditorBlocks.map((block) => {
                    if (block.type === "links") {
                      return (
                        <SortableShell key={block.id} id={block.id} className="shadow-none">
                          {({ attributes, listeners }) => (
                            <div className="group/item relative">
                              <Item
                                variant="default"
                                render={
                                  <Link
                                    href="/section/link"
                                    className="rounded-2xl bg-background py-3.5 shadow-brand transition-colors hover:bg-background!"
                                  />
                                }
                              >
                                <ItemMedia>
                                  <SparkleIcon />
                                </ItemMedia>
                                <ItemContent>
                                  <ItemTitle>Link</ItemTitle>
                                </ItemContent>
                                <ItemActions>
                                  <Button size="icon-sm" variant="ghost" aria-label="Link 열기">
                                    <ChevronRightIcon />
                                  </Button>
                                </ItemActions>
                              </Item>
                              <button
                                type="button"
                                className="absolute top-1/2 -right-6 inline-flex -translate-y-1/2 cursor-grab items-center justify-center bg-transparent text-muted-foreground opacity-0 transition-opacity group-hover/item:opacity-100"
                                aria-label="Link 블록 순서 변경"
                                {...attributes}
                                {...listeners}
                              >
                                <GripVertical className="size-4" />
                              </button>
                            </div>
                          )}
                        </SortableShell>
                      );
                    }

                    const item = editor.data?.textBoxItems.find(
                      (textBoxItem) => textBoxItem.id === block.textBoxId
                    );

                    if (!item) {
                      return null;
                    }

                    const title = item.title.trim() || "Untitled";

                    return (
                      <SortableShell key={block.id} id={block.id} className="shadow-none">
                        {({ attributes, listeners }) => (
                          <div className="group/item relative">
                            <button
                              type="button"
                              className="absolute top-1/2 -left-8 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground opacity-0 outline-none transition-opacity hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 group-hover/item:opacity-100"
                              onClick={() => void editor.handleDeleteTextBox(item.id)}
                              aria-label={`${title} 삭제`}
                            >
                              <XCircleIcon size={20} weight="fill" className="size-5" />
                            </button>
                            <Item
                              variant="default"
                              render={<button type="button" />}
                              className="rounded-lg bg-background py-4 text-left shadow-brand transition-colors hover:bg-background!"
                              onClick={() => setSelectedTextBoxId(item.id)}
                            >
                              <ItemMedia>
                                <SparkleIcon />
                              </ItemMedia>
                              <ItemContent>
                                <ItemTitle>{title}</ItemTitle>
                              </ItemContent>
                            </Item>
                            <button
                              type="button"
                              className="absolute top-1/2 -right-6 inline-flex -translate-y-1/2 cursor-grab items-center justify-center bg-transparent text-muted-foreground opacity-0 transition-opacity group-hover/item:opacity-100"
                              aria-label={`${title} 순서 변경`}
                              {...attributes}
                              {...listeners}
                            >
                              <GripVertical className="size-4" />
                            </button>
                          </div>
                        )}
                      </SortableShell>
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          ) : null}
        </div>
      </section>

      <section className="mt-12 space-y-3">
        <p className="text-sm text-muted-foreground">Other Block</p>
        <div className="flex flex-col gap-2">
          {otherBlockSections.map((section) => (
            <SectionLinkItem key={section.href} href={section.href} title={section.title} />
          ))}
        </div>
      </section>

      <Dialog
        open={Boolean(selectedTextBox)}
        onOpenChange={(open) => !open && setSelectedTextBoxId(null)}
      >
        <DialogPopup
          showCloseButton={false}
          className="fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-0 rounded-xl bg-popover p-0 text-sm text-popover-foreground ring-1 ring-foreground/10 outline-none sm:max-w-md"
        >
          <DialogHeader className="px-3 py-2">
            <div className="grid grid-cols-3 items-center">
              <DialogClose className="w-fit justify-self-start">
                <XIcon className="size-4" />
              </DialogClose>
              <DialogTitle className="justify-self-center text-sm font-semibold">Edit</DialogTitle>
              <DialogClose className="w-fit justify-self-end">
                <CheckIcon className="size-4" />
              </DialogClose>
            </div>
          </DialogHeader>

          {selectedTextBox ? (
            <div className="min-w-0 space-y-0 p-2">
              <Input
                value={selectedTextBox.title}
                onChange={(event) =>
                  editor.handleTextBoxChange(selectedTextBox.id, "title", event.target.value)
                }
                placeholder="What do you want to write?"
                className="w-full min-w-0 max-w-full border-0 font-medium !text-base focus-visible:ring-0"
              />
              <Textarea
                value={selectedTextBox.description ?? ""}
                onChange={(event) =>
                  editor.handleTextBoxChange(selectedTextBox.id, "description", event.target.value)
                }
                placeholder="Add description for detail"
                className="min-h-32 w-full min-w-0 max-h-64 max-w-full break-all resize-none overflow-x-hidden overflow-y-auto border-0 [field-sizing:fixed] [overflow-wrap:anywhere] focus-visible:ring-0"
              />
            </div>
          ) : null}
        </DialogPopup>
      </Dialog>
    </main>
  );
}
