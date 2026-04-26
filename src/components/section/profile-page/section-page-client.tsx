"use client";

import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  restrictToParentElement,
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  LinkSimpleIcon,
  NetworkIcon,
  TextAaIcon,
  UserIcon,
} from "@phosphor-icons/react";
import {
  ChevronRightIcon,
  GripVertical,
  Loader2Icon,
  TrashIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { SortableShell } from "@/components/section/profile-page/sortable-shell";
import { TextBoxEditDialog } from "@/components/section/profile-page/text-box-edit-dialog";
import { useProfilePageEditor } from "@/components/section/profile-page/use-profile-page-editor";
import { Button } from "@/components/ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";

const pageEditorSections = [
  {
    path: "profile",
    title: "Profile",
    Icon: UserIcon,
  },
  {
    path: "social",
    title: "Social",
    Icon: NetworkIcon,
  },
] as const;

const otherBlockSections = [
  {
    path: "text-box",
    title: "Text",
    Icon: TextAaIcon,
  },
] as const;

function getSectionBasePath(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const sectionIndex = segments.indexOf("section");

  if (sectionIndex === -1) {
    return "/section";
  }

  return `/${segments.slice(0, sectionIndex + 1).join("/")}`;
}

function SectionLinkItem({
  count,
  href,
  Icon,
  title,
}: {
  count?: number;
  href: string;
  Icon: typeof UserIcon;
  title: string;
}) {
  return (
    <Item
      variant="default"
      render={
        <Link
          href={href}
          className="rounded-2xl bg-background py-3.5 shadow-brand transition-colors hover:bg-background!"
        >
          <ItemMedia>
            <Icon className="size-5" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>{title}</ItemTitle>
          </ItemContent>
          <ItemActions>
            {typeof count === "number" ? (
              <span className="text-xs font-medium text-muted-foreground">
                {count}
              </span>
            ) : null}
            <Button size="icon-sm" variant="ghost" aria-label={`Open ${title}`}>
              <ChevronRightIcon />
            </Button>
          </ItemActions>
        </Link>
      }
    />
  );
}

export function SectionPageClient() {
  const editor = useProfilePageEditor();
  const pathname = usePathname();
  const sectionBasePath = getSectionBasePath(pathname);
  const [selectedTextBoxId, setSelectedTextBoxId] = useState<string | null>(
    null,
  );
  const selectedTextBox =
    editor.data?.textBoxItems.find((item) => item.id === selectedTextBoxId) ??
    null;

  return (
    <main className="h-full px-4 py-10 sm:px-0">
      <div className="space-y-8 pb-4">
        <header>
          <h1 className="text-3xl">My Page</h1>
        </header>
        <section className="space-y-3">
          <p className="text-xs text-muted-foreground uppercase">Page editor</p>

          <div className="flex flex-col gap-2">
            {pageEditorSections.map((section) => (
              <SectionLinkItem
                key={section.path}
                href={`${sectionBasePath}/${section.path}`}
                Icon={section.Icon}
                title={section.title}
                count={
                  section.title === "Social"
                    ? editor.data?.socialLinks.length
                    : undefined
                }
              />
            ))}

            {editor.isBooting ? (
              <div className="flex min-h-14 items-center justify-center rounded-lg bg-background shadow-brand">
                <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
              </div>
            ) : editor.data ? (
              <DndContext
                id="section-page-blocks"
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
                          <SortableShell
                            key={block.id}
                            id={block.id}
                            className="shadow-none"
                          >
                            {({ attributes, listeners }) => (
                              <div className="group/item relative">
                                <Item
                                  variant="default"
                                  render={
                                    <Link
                                      href={`${sectionBasePath}/link`}
                                      className="rounded-2xl bg-background py-3.5 shadow-brand transition-colors hover:bg-background!"
                                    />
                                  }
                                >
                                  <ItemMedia>
                                    <LinkSimpleIcon className="size-5" />
                                  </ItemMedia>
                                  <ItemContent>
                                    <ItemTitle>Link</ItemTitle>
                                  </ItemContent>
                                  <ItemActions>
                                    <span className="text-xs font-medium text-muted-foreground">
                                      {editor.data?.linkItems.length ?? 0}
                                    </span>
                                    <Button
                                      size="icon-sm"
                                      variant="ghost"
                                      aria-label="Open Link"
                                    >
                                      <ChevronRightIcon />
                                    </Button>
                                  </ItemActions>
                                </Item>
                                <button
                                  type="button"
                                  className="absolute top-1/2 -right-6 inline-flex -translate-y-1/2 cursor-grab items-center justify-center bg-transparent text-muted-foreground opacity-0 transition-opacity group-hover/item:opacity-100"
                                  aria-label="Reorder Link block"
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
                        (textBoxItem) => textBoxItem.id === block.textBoxId,
                      );

                      if (!item) {
                        return null;
                      }

                      const title = item.title.trim() || "Untitled";

                      return (
                        <SortableShell
                          key={block.id}
                          id={block.id}
                          className="shadow-none"
                        >
                          {({ attributes, listeners }) => (
                            <div className="group/item relative">
                              <button
                                type="button"
                                className="absolute top-1/2 -left-8 inline-flex size-7 -translate-y-1/2 items-center justify-center text-muted-foreground opacity-0 outline-none transition-opacity hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 group-hover/item:opacity-100 bg-background rounded-full shadow-sm border border-border/30"
                                onClick={() =>
                                  void editor.handleDeleteTextBox(item.id)
                                }
                                aria-label={`Delete ${title}`}
                              >
                                <TrashIcon className="text-primary size-4 stroke-2" />
                              </button>
                              <Item
                                variant="default"
                                render={<button type="button" />}
                                className="rounded-lg bg-background py-4 text-left shadow-brand transition-colors hover:bg-background!"
                                onClick={() => setSelectedTextBoxId(item.id)}
                              >
                                <ItemMedia>
                                  <TextAaIcon className="size-5" />
                                </ItemMedia>
                                <ItemContent>
                                  <ItemTitle>{title}</ItemTitle>
                                </ItemContent>
                              </Item>
                              <button
                                type="button"
                                className="absolute top-1/2 -right-6 inline-flex -translate-y-1/2 cursor-grab items-center justify-center bg-transparent text-muted-foreground opacity-0 transition-opacity group-hover/item:opacity-100"
                                aria-label={`Reorder ${title}`}
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
          <p className="text-xs text-muted-foreground uppercase">Other Block</p>
          <div className="flex flex-col gap-2">
            {otherBlockSections.map((section) => (
              <SectionLinkItem
                key={section.path}
                href={`${sectionBasePath}/${section.path}`}
                Icon={section.Icon}
                title={section.title}
              />
            ))}
          </div>
        </section>

        <TextBoxEditDialog
          textBox={selectedTextBox}
          onOpenChange={(open) => !open && setSelectedTextBoxId(null)}
          onTextBoxChange={editor.handleTextBoxChange}
        />
      </div>
    </main>
  );
}
