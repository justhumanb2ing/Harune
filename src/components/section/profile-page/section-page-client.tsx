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
import { LinkSimpleIcon, TextAaIcon } from "@phosphor-icons/react";
import {
  ChevronRightIcon,
  GripVertical,
  Loader2Icon,
  TrashIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import {
  ColorInstagramIcon,
  ColorSpotifyIcon,
  ColorYoutubeIcon,
} from "@/components/icon";
import { SortableShell } from "@/components/section/profile-page/sortable-shell";
import { TextBlockSectionLinkItem } from "@/components/section/profile-page/text-block-section-link-item";
import { TextBoxEditDialog } from "@/components/section/profile-page/text-box-edit-dialog";
import { useProfilePageEditor } from "@/components/section/profile-page/use-profile-page-editor";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const sectionLinkClassName =
  "group/item flex w-full flex-wrap gap-2.5 rounded-2xl bg-background px-4 py-3 text-sm shadow-float transition-colors outline-none hover:bg-background! focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 hover:bg-secondary/30!";

const sectionButtonClassName =
  "group/item flex w-full items-center gap-2.5 rounded-2xl bg-background px-4 py-6 text-left text-sm shadow-float transition-colors outline-none hover:bg-background! focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

const sectionMediaClassName =
  "flex shrink-0 items-center justify-center gap-2 [&_svg]:pointer-events-none";

const sectionActionsClassName =
  "ml-auto flex shrink-0 items-center justify-end gap-2";

function getSectionBasePath(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const sectionIndex = segments.indexOf("section");

  if (sectionIndex === -1) {
    return "/section";
  }

  return `/${segments.slice(0, sectionIndex + 1).join("/")}`;
}

function ProfileSectionLinkItem({ href }: { href: string }) {
  return (
    <Link href={href} className={cn(sectionLinkClassName, "aspect-square")}>
      <span className={"flex flex-1 flex-col gap-1"}>
        <span
          className={
            "flex w-fit items-center gap-2 text-2xl leading-snug font-medium"
          }
        >
          Profile
        </span>
      </span>
    </Link>
  );
}

function SocialSectionLinkItem({ href }: { href: string }) {
  return (
    <Link href={href} className={cn(sectionLinkClassName, "aspect-square")}>
      <span className={"flex flex-1 flex-col gap-1"}>
        <span className="flex flex-1 w-fit flex-col items-start justify-between gap-10 text-2xl leading-snug font-medium">
          <span>Social</span>
          <AvatarGroup>
            <Avatar size="lg">
              <AvatarFallback className={"bg-secondary"}>
                <ColorInstagramIcon className="size-6" aria-hidden="true" />
              </AvatarFallback>
            </Avatar>
            <Avatar size="lg">
              <AvatarFallback className={"bg-secondary"}>
                <ColorYoutubeIcon className="size-6" aria-hidden="true" />
              </AvatarFallback>
            </Avatar>
            <Avatar size="lg">
              <AvatarFallback className={"bg-secondary"}>
                <ColorSpotifyIcon className="size-6" aria-hidden="true" />
              </AvatarFallback>
            </Avatar>
            <AvatarGroupCount className="bg-secondary">+8</AvatarGroupCount>
          </AvatarGroup>
        </span>
      </span>
    </Link>
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
          <h1 className="text-3xl font-semibold">My Page</h1>
        </header>
        <section className="space-y-3">
          <div className="flex flex-col gap-2">
            <div className="flex flex-row gap-2">
              <ProfileSectionLinkItem href={`${sectionBasePath}/profile`} />
              <SocialSectionLinkItem href={`${sectionBasePath}/social`} />
            </div>

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
                                <Link
                                  href={`${sectionBasePath}/link`}
                                  className={
                                    "group/item flex w-full flex-wrap gap-2.5 rounded-2xl bg-background px-4 py-6 text-sm shadow-float transition-colors outline-none"
                                  }
                                >
                                  <span
                                    className={sectionMediaClassName}
                                    aria-hidden="true"
                                  >
                                    <LinkSimpleIcon
                                      className="size-6"
                                      weight="bold"
                                    />
                                  </span>
                                  <span
                                    className={"flex flex-1 flex-col gap-1"}
                                  >
                                    <span
                                      className={
                                        "line-clamp-1 flex w-fit items-center gap-2 text-lg leading-snug font-medium underline-offset-4"
                                      }
                                    >
                                      Link
                                    </span>
                                  </span>
                                  <span className={sectionActionsClassName}>
                                    <span className="text-base font-medium text-muted-foreground">
                                      {editor.data?.linkItems.length ?? 0}
                                    </span>
                                    <ChevronRightIcon
                                      className="size-5 stroke-3"
                                      aria-hidden="true"
                                    />
                                  </span>
                                </Link>
                                <button
                                  type="button"
                                  className="size-7 absolute top-1/2 -right-8 inline-flex -translate-y-1/2 cursor-grab items-center justify-center opacity-0 transition-opacity group-hover/item:opacity-100
                                  bg-primary rounded-full shadow-sm border border-border/30"
                                  aria-label="Reorder Link block"
                                  {...attributes}
                                  {...listeners}
                                >
                                  <GripVertical className="text-primary-foreground size-4 stroke-3" />
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
                                className="absolute top-1/2 -left-8 inline-flex size-7 -translate-y-1/2 items-center justify-center text-muted-foreground opacity-0 outline-none transition-opacity focus-visible:ring-3 focus-visible:ring-ring/50 group-hover/item:opacity-100 bg-primary rounded-full shadow-sm border border-border/30"
                                onClick={() =>
                                  void editor.handleDeleteTextBox(item.id)
                                }
                                aria-label={`Delete ${title}`}
                              >
                                <TrashIcon className="text-primary-foreground size-4 stroke-3" />
                              </button>
                              <button
                                type="button"
                                className={cn(
                                  sectionButtonClassName,
                                  "min-w-0",
                                )}
                                onClick={() => setSelectedTextBoxId(item.id)}
                              >
                                <span
                                  className={sectionMediaClassName}
                                  aria-hidden="true"
                                >
                                  <TextAaIcon
                                    className="size-6"
                                    weight="bold"
                                  />
                                </span>
                                <span
                                  className={
                                    "min-w-0 line-clamp-1 items-center text-lg leading-snug font-medium truncate"
                                  }
                                >
                                  {title}
                                </span>
                              </button>
                              <button
                                type="button"
                                className="size-7 absolute top-1/2 -right-8 inline-flex -translate-y-1/2 cursor-grab items-center justify-center opacity-0 transition-opacity group-hover/item:opacity-100 bg-primary rounded-full shadow-sm border border-border/30"
                                aria-label={`Reorder ${title}`}
                                {...attributes}
                                {...listeners}
                              >
                                <GripVertical className="text-primary-foreground size-4 stroke-3" />
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
            <TextBlockSectionLinkItem onAdd={editor.handleCreateTextBox} />
            <div
              className={cn(
                "group/item flex justify-center items-center w-full rounded-2xl bg-background px-4 py-3 text-sm",
                "bg-secondary aspect-square border-4 border-dashed border-border/50 cursor-not-allowed",
              )}
            >
              <p
                className={
                  "flex flex-col items-center gap-2 text-2xl font-bold text-muted-foreground"
                }
              >
                <span>TBD</span>
                <span className="text-xs font-normal">Coming soon...</span>
              </p>
            </div>
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
