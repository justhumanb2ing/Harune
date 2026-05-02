import type { PlaylistProvider } from "@/lib/profile-page/playlist";
import { resolvePlaylistProvider } from "@/lib/profile-page/playlist";

export type IframelyResponse = IframelySuccessResponse | IframelyErrorResponse;

export interface IframelySuccessResponse {
  meta: IframelyMeta;
  links: IframelyLink[];

  rel?: string[];
  html?: string;
  options?: IframelyOptions;
}

export interface IframelyErrorResponse {
  error: {
    source: "iframely";
    code: number;
    message: string;
    messages?: string[];
  };
}

export interface IframelyMeta {
  title: string;
  site?: string;
  author?: string;
  author_url?: string;
  description?: string;
  canonical?: string;
  medium?: string;
}

export interface IframelyLink {
  href: string;
  type: string;
  rel: string[];

  html?: string;
  media?: IframelyMedia;
  options?: IframelyOptions;
  content_length?: number;
}

export interface IframelyMedia {
  width?: number;
  height?: number;
  "aspect-ratio"?: number;
}

export interface IframelyOptions {
  [key: string]: IframelyOptionItem;
}

export interface IframelyOptionItem {
  label: string;
  value: unknown;
  values?: Record<string, string>;
}

export type PlaylistDraftFromIframely = {
  content: string;
  provider: PlaylistProvider;
  title: string;
};

export function resolvePlaylistDraftFromIframely(
  response: IframelyResponse
): PlaylistDraftFromIframely {
  if ("error" in response) {
    throw new Error(response.error.message);
  }

  const title = response.meta.title.trim();
  const provider = resolvePlaylistProvider(response.meta.site);
  const content = response.html?.trim() ?? "";

  if (!title) {
    throw new Error("Iframely did not return a playlist title.");
  }

  if (!provider) {
    throw new Error("Unsupported playlist provider.");
  }

  if (!content) {
    throw new Error("Iframely did not return playlist content.");
  }

  return {
    title,
    provider,
    content,
  };
}
