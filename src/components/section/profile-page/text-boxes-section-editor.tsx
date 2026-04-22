"use client";

import { DndContext, closestCenter } from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { XCircleIcon } from "@phosphor-icons/react";
import { CheckIcon, GripVertical, XIcon } from "lucide-react";
import { type FocusEvent, useRef, useState } from "react";

import {
  Dialog,
  DialogClose,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/animate-ui/components/base/dialog";
import { ProfilePageSectionLayout } from "@/components/section/profile-page/section-layout";
import { SortableShell } from "@/components/section/profile-page/sortable-shell";
import { useProfilePageEditor } from "@/components/section/profile-page/use-profile-page-editor";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupInput, InputGroupTextarea } from "@/components/ui/input-group";
import { Item, ItemDescription, ItemTitle } from "@/components/ui/item";
import { Textarea } from "@/components/ui/textarea";

export function TextBoxesSectionEditor() {
  const editor = useProfilePageEditor();
  const composerRef = useRef<HTMLDivElement | null>(null);
  const [selectedTextBoxId, setSelectedTextBoxId] = useState<string | null>(null);
  const selectedTextBox =
    editor.data?.textBoxItems.find((item) => item.id === selectedTextBoxId) ?? null;
  const handleComposerBlur = (event: FocusEvent<HTMLDivElement>) => {
    const nextFocusedNode = event.relatedTarget;

    if (nextFocusedNode instanceof Node && composerRef.current?.contains(nextFocusedNode)) {
      return;
    }

    editor.handleNewTextBoxComposerBlur();
  };

  return (
    <ProfilePageSectionLayout
      title="Text"
      description="Use text boxes for notes, context, and non-link content."
      isLoading={editor.isBooting || editor.isUserLoading}
      hasData={Boolean(editor.data)}
    >
      {editor.data ? (
        <div className="space-y-6">
          <div ref={composerRef} className="space-y-3 border-b pb-6" onBlur={handleComposerBlur}>
            <FieldGroup className="gap-3">
              <Field className="relative rounded-lg bg-background shadow-xs outline-none py-4">
                <FieldLabel
                  htmlFor="new-text-box-title"
                  className="block px-4 font-medium text-xs text-foreground uppercase"
                >
                  Title
                </FieldLabel>
                <InputGroup className="bg-background border-0 px-1.5 font-medium ring-0 has-[[data-slot=input-group-control]:focus-visible]:border-transparent has-[[data-slot=input-group-control]:focus-visible]:ring-0">
                  <InputGroupInput
                    id="new-text-box-title"
                    value={editor.newTextBox.title}
                    onChange={(event) =>
                      editor.setNewTextBox((prev) => ({
                        ...prev,
                        title: event.target.value,
                      }))
                    }
                    placeholder="What do you want to write?"
                    className="text-sm"
                  />
                </InputGroup>
              </Field>
              <Field className="relative rounded-lg bg-background shadow-xs outline-none py-4">
                <FieldLabel
                  htmlFor="new-text-box-description"
                  className="block px-4 font-medium text-xs text-foreground uppercase"
                >
                  Description
                </FieldLabel>
                <InputGroup className="bg-background border-0 px-1.5 ring-0 has-[[data-slot=input-group-control]:focus-visible]:border-transparent has-[[data-slot=input-group-control]:focus-visible]:ring-0">
                  <InputGroupTextarea
                    id="new-text-box-description"
                    value={editor.newTextBox.description}
                    onChange={(event) =>
                      editor.setNewTextBox((prev) => ({
                        ...prev,
                        description: event.target.value,
                      }))
                    }
                    placeholder="Add description for detail"
                    className="min-h-12 text-sm"
                  />
                </InputGroup>
              </Field>
            </FieldGroup>
          </div>

          <DndContext
            sensors={editor.sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            onDragEnd={(event) => void editor.handleTextBoxDragEnd(event)}
          >
            <SortableContext
              items={editor.data.textBoxItems.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {editor.data.textBoxItems.map((item) => (
                  <SortableShell key={item.id} id={item.id}>
                    {({ attributes, listeners }) => {
                      const title = item.title.trim() || "Untitled";
                      const description = item.description?.trim() || "No description";

                      return (
                        <div className="group/item relative">
                          <button
                            type="button"
                            className="absolute top-1/2 -left-8 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-[min(var(--radius-md),12px)] text-muted-foreground opacity-0 outline-none transition-[opacity,background-color,color,box-shadow] group-hover/item:opacity-100 hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
                            onClick={() => void editor.handleDeleteTextBox(item.id)}
                            aria-label={`${title} 삭제`}
                          >
                            <XCircleIcon size={20} weight="fill" className="size-5" />
                          </button>
                          <Item
                            render={<button type="button" />}
                            variant="default"
                            className="min-h-16 flex-col items-stretch gap-1 rounded-md border-0 bg-background px-4 py-3 text-left shadow-xs"
                            onClick={() => setSelectedTextBoxId(item.id)}
                          >
                            <ItemTitle className="w-full truncate line-clamp-1">{title}</ItemTitle>
                            <ItemDescription className="w-full truncate line-clamp-1">
                              {description}
                            </ItemDescription>
                          </Item>
                          <button
                            type="button"
                            className="absolute top-1/2 -right-6 inline-flex -translate-y-1/2 cursor-grab items-center justify-center bg-transparent text-muted-foreground opacity-0 transition-opacity group-hover/item:opacity-100"
                            aria-label={`${title} 순서 변경`}
                            onClick={(event) => event.stopPropagation()}
                            {...attributes}
                            {...listeners}
                          >
                            <GripVertical className="size-4" />
                          </button>
                        </div>
                      );
                    }}
                  </SortableShell>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      ) : null}

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
            <div className="space-y-0 p-2">
              <Input
                value={selectedTextBox.title}
                onChange={(event) =>
                  editor.handleTextBoxChange(selectedTextBox.id, "title", event.target.value)
                }
                placeholder="What do you want to write?"
                className="border-0 focus-visible:ring-0 font-medium text-base! truncate"
              />
              <Textarea
                value={selectedTextBox.description ?? ""}
                onChange={(event) =>
                  editor.handleTextBoxChange(selectedTextBox.id, "description", event.target.value)
                }
                placeholder="Add description for detail"
                className="min-h-32 max-h-64 resize-none overflow-y-auto border-0 focus-visible:ring-0"
              />
            </div>
          ) : null}
        </DialogPopup>
      </Dialog>
    </ProfilePageSectionLayout>
  );
}
