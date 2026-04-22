"use client";

import { DndContext, closestCenter } from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { XCircle, XCircleIcon } from "@phosphor-icons/react";
import { ArrowRightIcon, GripVertical, LoaderIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";

import { ProfilePageSectionLayout } from "@/components/section/profile-page/section-layout";
import { SortableShell } from "@/components/section/profile-page/sortable-shell";
import { useProfilePageEditor } from "@/components/section/profile-page/use-profile-page-editor";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item";

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

const fieldClassName = "relative rounded-lg bg-background py-4 shadow-xs outline-none";
const inputGroupClassName =
  "border-0 bg-background! px-1.5 ring-0 has-[[data-slot=input-group-control]:focus-visible]:border-transparent has-[[data-slot=input-group-control]:focus-visible]:ring-0";

const getLinkTitle = (title: string | null, url: string) => {
  const trimmedTitle = title?.trim();

  if (trimmedTitle) {
    return trimmedTitle;
  }

  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

export function LinksSectionEditor() {
  const editor = useProfilePageEditor();
  const [isCrawling, setIsCrawling] = useState(false);
  const [preview, setPreview] = useState<OgData | null>(null);

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
        title: getLinkTitle(nextPreview.title, resolvedUrl),
        description: resolvedUrl,
        favicon: nextPreview.favicon ?? "",
        url: resolvedUrl,
      };

      setPreview(nextPreview);
      editor.setNewLink(nextLink);
    } catch (error) {
      setPreview(null);
      toast.error(error instanceof Error ? error.message : "링크 정보를 불러오지 못했습니다.");
    } finally {
      setIsCrawling(false);
    }
  };

  return (
    <ProfilePageSectionLayout
      title="Links"
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
                    onChange={(event) => {
                      setPreview(null);
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

            {preview ? (
              <Item variant="default" className="bg-background hover:bg-background! p-4">
                {preview.favicon ? (
                  <ItemMedia variant="image" className="size-8">
                    <Image
                      src={preview.favicon}
                      alt={getLinkTitle(preview.title, preview.url ?? editor.newLink.url)}
                      width={28}
                      height={28}
                      unoptimized
                      className="object-cover"
                    />
                  </ItemMedia>
                ) : (
                  <ItemMedia variant="image">
                    <div className="size-full rounded-sm bg-secondary" />
                  </ItemMedia>
                )}
                <ItemContent>
                  <ItemTitle className="line-clamp-1 text-xs!">
                    {getLinkTitle(preview.title, preview.url ?? editor.newLink.url)}
                  </ItemTitle>
                  <ItemDescription className="text-xs">
                    {preview.url ?? editor.newLink.url}
                  </ItemDescription>
                </ItemContent>
              </Item>
            ) : null}

            <div className="flex justify-end">
              <Button
                type="button"
                onClick={() => editor.handleCreateLink()}
                disabled={
                  !editor.newLink.url.trim() || !editor.newLink.title.trim() || editor.isSyncing
                }
              >
                Add link
              </Button>
            </div>
          </div>

          <DndContext
            sensors={editor.sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={(event) => void editor.handleLinkDragEnd(event)}
          >
            <SortableContext
              items={editor.data.linkItems.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {editor.data.linkItems.map((item) => (
                  <SortableShell key={item.id} id={item.id}>
                    {({ attributes, listeners }) => (
                      <div className="group/item relative before:absolute before:-inset-y-2 before:-left-9 before:-right-9 before:content-['']">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="absolute top-1/2 -left-8 z-10 -translate-y-1/2 opacity-0 pointer-events-none transition-opacity active:not-aria-[haspopup]:translate-y-0 group-hover/item:opacity-100 group-hover/item:pointer-events-auto"
                          onClick={() => void editor.handleDeleteLink(item.id)}
                          aria-label="링크 삭제"
                        >
                          <XCircleIcon
                            size={20}
                            weight="fill"
                            className="size-5 text-muted-foreground"
                          />
                        </Button>
                        <Item variant="default" className="bg-background hover:bg-background! p-4">
                          {item.favicon ? (
                            <ItemMedia variant="image" className="size-8">
                              <Image
                                src={item.favicon}
                                alt={item.title}
                                width={28}
                                height={28}
                                unoptimized
                                className="object-cover"
                              />
                            </ItemMedia>
                          ) : (
                            <ItemMedia variant="image">
                              <div className="size-full rounded-sm bg-secondary" />
                            </ItemMedia>
                          )}
                          <ItemContent>
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-lg"
                            >
                              <ItemTitle className="line-clamp-1 text-xs!">{item.title}</ItemTitle>
                              <ItemDescription className="text-xs">{item.url}</ItemDescription>
                            </a>
                          </ItemContent>
                        </Item>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="absolute top-1/2 -right-6 z-10 inline-flex -translate-y-1/2 cursor-grab items-center justify-center text-muted-foreground opacity-0 pointer-events-none transition-opacity active:not-aria-[haspopup]:translate-y-0 group-hover/item:opacity-100 group-hover/item:pointer-events-auto"
                          aria-label="링크 순서 변경"
                          {...attributes}
                          {...listeners}
                        >
                          <GripVertical className="size-4" />
                        </Button>
                      </div>
                    )}
                  </SortableShell>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      ) : null}
    </ProfilePageSectionLayout>
  );
}
