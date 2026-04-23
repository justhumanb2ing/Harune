"use client";

import { DndContext, closestCenter } from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CheckIcon, XCircleIcon } from "@phosphor-icons/react";
import { ArrowRightIcon, GripVertical, LoaderIcon, XIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";

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
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Textarea } from "@/components/ui/textarea";

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

type ApiResponse<TData, TMeta = undefined> = SuccessResponse<TData, TMeta> | ErrorResponse;

interface CrawlResponseMeta {
  mode: CrawlMode;
  fallback: boolean;
  durationMs: number;
  timings?: CrawlTimings;
  cache?: CacheMeta;
}

type CrawlApiResponse = ApiResponse<OgData, CrawlResponseMeta>;

const fieldClassName = "relative rounded-lg bg-background py-4 shadow-brand! outline-none";
const inputGroupClassName =
  "border-0 bg-background! px-1.5 ring-0 has-[[data-slot=input-group-control]:focus-visible]:border-transparent has-[[data-slot=input-group-control]:focus-visible]:ring-0";

export function LinksSectionEditor() {
  const editor = useProfilePageEditor();
  const [isCrawling, setIsCrawling] = useState(false);
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);
  const selectedLink = editor.data?.linkItems.find((item) => item.id === selectedLinkId) ?? null;

  const handleCrawl = async () => {
    const rawUrl = editor.newLink.url.trim();

    if (!rawUrl) {
      toast.error("URL을 입력해 주세요.");
      return;
    }

    try {
      new URL(rawUrl);
    } catch {
      toast.error("올바른 URL 형식을 입력해 주세요.");
      return;
    }

    try {
      setIsCrawling(true);
      const searchParams = new URLSearchParams({
        url: rawUrl,
        mode: "auto",
      });
      const response = await fetch(`https://api.bybu.cc/api/crawl?${searchParams.toString()}`);
      const body = (await response.json()) as CrawlApiResponse;

      if (!response.ok || !body.ok) {
        throw new Error(body.ok ? "링크 정보를 불러오지 못했습니다." : body.error.message);
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
      toast.error(error instanceof Error ? error.message : "링크 정보를 불러오지 못했습니다.");
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
                <FieldLabel
                  htmlFor="profile-page-link-url"
                  className="block px-4 font-medium text-xs text-foreground uppercase"
                >
                  URL
                </FieldLabel>
                <InputGroup className={inputGroupClassName}>
                  <InputGroupInput
                    id="profile-page-link-url"
                    placeholder="https://example.com"
                    autoComplete="off"
                    className="text-sm"
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
                      variant="ghost"
                      size="icon-xs"
                      disabled={isCrawling || !editor.newLink.url.trim()}
                      aria-label="링크 정보 불러오기"
                    >
                      {isCrawling ? (
                        <LoaderIcon className="size-4 animate-spin" />
                      ) : (
                        <ArrowRightIcon className="size-4" />
                      )}
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
                  <SortableShell key={item.id} id={item.id} className="shadow-none">
                    {({ attributes, listeners }) => (
                      <div className="group/item relative before:pointer-events-none before:absolute before:-inset-y-2 before:-left-9 before:-right-9 before:content-['']">
                        <button
                          type="button"
                          className="absolute top-1/2 -left-8 z-10 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-[min(var(--radius-md),12px)] text-muted-foreground opacity-0 outline-none transition-[opacity,background-color,color,box-shadow] group-hover/item:opacity-100 hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
                          onClick={(event) => {
                            event.stopPropagation();
                            void editor.handleDeleteLink(item.id);
                          }}
                          aria-label="링크 삭제"
                        >
                          <XCircleIcon
                            size={20}
                            weight="fill"
                            className="size-5 text-muted-foreground"
                          />
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
                          aria-label="링크 순서 변경"
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

      <Dialog
        open={Boolean(selectedLink)}
        onOpenChange={(open) => !open && setSelectedLinkId(null)}
      >
        <DialogPopup
          showCloseButton={false}
          className="fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-0 rounded-xl bg-popover p-0 text-sm text-popover-foreground ring-1 ring-foreground/10 outline-none sm:max-w-md"
        >
          <DialogHeader className="px-3 py-2">
            <div className="grid grid-cols-3 items-center">
              <DialogClose className="w-fit justify-self-start">
                <XIcon size={20} className="size-4" />
              </DialogClose>
              <DialogTitle className="justify-self-center text-sm font-semibold">Edit</DialogTitle>
              <DialogClose className="w-fit justify-self-end">
                <CheckIcon size={20} weight="bold" className="size-4" />
              </DialogClose>
            </div>
          </DialogHeader>

          {selectedLink ? (
            <div className="space-y-0 p-2">
              <Input
                value={selectedLink.title}
                onChange={(event) =>
                  editor.handleLinkItemChange(selectedLink.id, "title", event.target.value)
                }
                placeholder="What do you want to show?"
                className="border-0 font-medium text-base! focus-visible:ring-0"
              />
              <Textarea
                value={selectedLink.description ?? ""}
                onChange={(event) =>
                  editor.handleLinkItemChange(selectedLink.id, "description", event.target.value)
                }
                placeholder="Add description for detail"
                className="min-h-32 resize-none border-0 focus-visible:ring-0 break-all"
              />
            </div>
          ) : null}
        </DialogPopup>
      </Dialog>
    </ProfilePageSectionLayout>
  );
}
