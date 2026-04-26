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
import { GripVertical, TrashIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";

import { LinkEditDialog } from "@/components/section/profile-page/link-edit-dialog";
import { ProfilePageSectionLayout } from "@/components/section/profile-page/section-layout";
import { SortableShell } from "@/components/section/profile-page/sortable-shell";
import { useProfilePageEditor } from "@/components/section/profile-page/use-profile-page-editor";
import { Field } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

type CrawlMode = "auto" | "static" | "dynamic";

interface OgData {
  title: string | null;
  description: string | null;
  url: string | null;
  site_name: string | null;
  image: string | null;
  favicon: string | null;
}

interface StaticTimingMeta {
  head_only?: boolean;
  head_complete?: boolean;
  head_bytes?: number;
  head_truncated?: boolean;
  head_fallback?: boolean;
}

interface StageTiming {
  fetchMs?: number;
  launchMs?: number;
  navigationMs?: number;
  extractMs?: number;
  totalMs: number;
  meta?: StaticTimingMeta;
}

interface CrawlTimings {
  static?: StageTiming;
  dynamic?: StageTiming;
}

interface CacheMeta {
  hit: boolean;
  ttlMs?: number;
  ageMs?: number;
  bypassed?: boolean;
}

interface ErrorBody {
  message: string;
  status: number;
  code?: string;
  details?: Record<string, unknown>;
}

interface SuccessResponse<TData, TMeta = undefined> {
  ok: true;
  data: TData;
  meta?: TMeta;
}

interface ErrorResponse {
  ok: false;
  error: ErrorBody;
}

type ApiResponse<TData, TMeta = undefined> =
  | SuccessResponse<TData, TMeta>
  | ErrorResponse;

interface CrawlResponseMeta {
  mode: CrawlMode;
  fallback: boolean;
  durationMs: number;
  timings?: CrawlTimings;
  cache?: CacheMeta;
}

type CrawlApiResponse = ApiResponse<OgData, CrawlResponseMeta>;

const fieldClassName =
  "relative rounded-lg bg-background py-4 shadow-brand! outline-none";
const inputGroupClassName =
  "border-0 bg-background! px-1.5 ring-0 has-[[data-slot=input-group-control]:focus-visible]:border-transparent has-[[data-slot=input-group-control]:focus-visible]:ring-0";

export function LinksSectionEditor() {
  const editor = useProfilePageEditor();
  const [isCrawling, setIsCrawling] = useState(false);
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);
  const selectedLink =
    editor.data?.linkItems.find((item) => item.id === selectedLinkId) ?? null;

  const handleCrawl = async () => {
    const rawUrl = editor.newLink.url.trim();

    if (!rawUrl) {
      toast.error("Please enter a URL");
      return;
    }

    try {
      new URL(rawUrl);
    } catch {
      toast.error("Please enter a valid URL");
      return;
    }

    try {
      setIsCrawling(true);
      const searchParams = new URLSearchParams({
        url: rawUrl,
        mode: "auto",
      });
      const response = await fetch(
        `https://api.bybu.cc/api/crawl?${searchParams.toString()}`,
      );
      const body = (await response.json()) as CrawlApiResponse;

      if (!response.ok || !body.ok) {
        throw new Error(
          body.ok ? "Could not fetch link details" : body.error.message,
        );
      }

      const resolvedUrl = body.data.url?.trim() || rawUrl;
      const nextPreview: OgData = {
        ...body.data,
        url: resolvedUrl,
        favicon: body.data.favicon?.trim() || null,
      };
      const nextLink = {
        title: nextPreview.title ?? "",
        description: nextPreview.description ?? "",
        favicon: nextPreview.favicon ?? "",
        url: resolvedUrl,
      };

      editor.setNewLink(nextLink);
      editor.handleCreateLink();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message.replace(/\./g, "")
          : "Could not fetch link details",
      );
    } finally {
      setIsCrawling(false);
    }
  };

  return (
    <ProfilePageSectionLayout
      title="Link"
      description="Drag to reorder. URLs are fetched and added automatically."
      isLoading={editor.isBooting || editor.isUserLoading}
      hasData={Boolean(editor.data)}
    >
      {editor.data ? (
        <div className="space-y-4">
          <div className="space-y-3">
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                void handleCrawl();
              }}
            >
              <Field className={fieldClassName}>
                <InputGroup className={inputGroupClassName}>
                  <InputGroupInput
                    id="profile-page-link-url"
                    placeholder="https://example.com"
                    autoComplete="off"
                    className="text-base!"
                    value={editor.newLink.url}
                    disabled={isCrawling}
                    onChange={(event) => {
                      editor.setNewLink((prev) => ({
                        ...prev,
                        title: "",
                        description: "",
                        favicon: "",
                        url: event.target.value,
                      }));
                    }}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      type="submit"
                      variant="outline"
                      // size="icon-xs"
                      disabled={isCrawling || !editor.newLink.url.trim()}
                      aria-label="Fetch link details"
                      className="bg-background h-10 text-black font-semibold shadow-sm px-4 border-border/60 text-base"
                    >
                      {isCrawling ? <span>Getting...</span> : <span>Get</span>}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
              </Field>
            </form>
          </div>

          <DndContext
            id="section-link-items"
            sensors={editor.sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            onDragEnd={(event) => void editor.handleLinkDragEnd(event)}
          >
            <SortableContext
              items={editor.data.linkItems.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {editor.data.linkItems.map((item) => (
                  <SortableShell
                    key={item.id}
                    id={item.id}
                    className="shadow-none"
                  >
                    {({ attributes, listeners }) => (
                      <div className="group/item relative before:pointer-events-none before:absolute before:-inset-y-2 before:-left-9 before:-right-9 before:content-['']">
                        <button
                          type="button"
                          className="absolute top-1/2 -left-8 z-10 inline-flex size-7 -translate-y-1/2 items-center justify-center text-muted-foreground opacity-0 outline-none transition-[opacity,background-color,color,box-shadow] group-hover/item:opacity-100 hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50
                          bg-background rounded-full shadow-sm border border-border/30"
                          onClick={(event) => {
                            event.stopPropagation();
                            void editor.handleDeleteLink(item.id);
                          }}
                          aria-label="Delete link"
                        >
                          <TrashIcon className="text-primary size-4 stroke-2" />
                        </button>
                        <button
                          type="button"
                          className="relative z-0 flex w-full flex-wrap items-center gap-2.5 rounded-lg border border-transparent bg-background p-2 text-left text-sm shadow-brand outline-none transition-colors duration-100 hover:bg-background! focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                          onClick={() => setSelectedLinkId(item.id)}
                        >
                          {item.favicon ? (
                            <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-sm">
                              <Image
                                src={item.favicon}
                                alt={item.title}
                                width={28}
                                height={28}
                                unoptimized
                                className="object-cover"
                              />
                            </span>
                          ) : (
                            <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-sm">
                              <span className="size-full rounded-sm bg-secondary" />
                            </span>
                          )}
                          <span className="flex min-w-0 flex-1 flex-col gap-1">
                            <span className="line-clamp-1 text-xs font-medium leading-snug">
                              {item.title}
                            </span>
                            <span className="line-clamp-2 text-left text-xs font-normal leading-normal text-muted-foreground">
                              {item.url}
                            </span>
                          </span>
                        </button>
                        <button
                          type="button"
                          className="absolute top-1/2 -right-6 z-10 inline-flex -translate-y-1/2 cursor-grab items-center justify-center bg-transparent text-muted-foreground opacity-0 transition-opacity group-hover/item:opacity-100"
                          aria-label="Reorder link"
                          onClick={(event) => event.stopPropagation()}
                          {...attributes}
                          {...listeners}
                        >
                          <GripVertical className="size-4" />
                        </button>
                      </div>
                    )}
                  </SortableShell>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      ) : null}

      <LinkEditDialog
        link={selectedLink}
        onOpenChange={(open) => !open && setSelectedLinkId(null)}
        onLinkItemChange={editor.handleLinkItemChange}
      />
    </ProfilePageSectionLayout>
  );
}
