"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type SpotifyEmbedPanelProps = {
  className?: string;
  showDragHandle?: boolean;
  uri: string;
};

type SpotifyIFrameController = {
  destroy: () => void;
  loadUri: (spotifyUri: string, preferVideo?: boolean, startAt?: number, theme?: "dark") => void;
};

type SpotifyIFrameAPI = {
  createController: (
    element: HTMLElement,
    options: {
      height?: number | string;
      uri: string;
      width?: number | string;
      theme?: string;
    },
    callback: (controller: SpotifyIFrameController) => void
  ) => void;
};

declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: SpotifyIFrameAPI) => void;
  }
}

const SPOTIFY_IFRAME_API_SRC = "https://open.spotify.com/embed/iframe-api/v1";

let spotifyIframeApiPromise: Promise<SpotifyIFrameAPI> | null = null;
let spotifyIframeApiResolve: ((api: SpotifyIFrameAPI) => void) | null = null;
let spotifyIframeApiResolved: SpotifyIFrameAPI | null = null;

function loadSpotifyIframeApi() {
  if (spotifyIframeApiResolved) {
    return Promise.resolve(spotifyIframeApiResolved);
  }

  if (!spotifyIframeApiPromise) {
    spotifyIframeApiPromise = new Promise<SpotifyIFrameAPI>((resolve) => {
      spotifyIframeApiResolve = resolve;
    });

    const previousReadyHandler = window.onSpotifyIframeApiReady;

    window.onSpotifyIframeApiReady = (api) => {
      spotifyIframeApiResolved = api;
      spotifyIframeApiResolve?.(api);
      previousReadyHandler?.(api);
    };

    if (!document.querySelector(`script[src="${SPOTIFY_IFRAME_API_SRC}"]`)) {
      const script = document.createElement("script");
      script.async = true;
      script.src = SPOTIFY_IFRAME_API_SRC;
      document.head.append(script);
    }
  }

  return spotifyIframeApiPromise;
}

export function SpotifyEmbedPanel({
  className,
  showDragHandle = false,
  uri,
}: SpotifyEmbedPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    let controller: SpotifyIFrameController | null = null;
    let cancelled = false;

    void loadSpotifyIframeApi().then((api) => {
      if (cancelled || !containerRef.current) {
        return;
      }

      api.createController(
        containerRef.current,
        {
          height: "100%",
          uri,
          width: "100%",
          theme: "dark",
        },
        (embedController) => {
          if (cancelled) {
            embedController.destroy();
            return;
          }

          controller = embedController;
          embedController.loadUri(uri, undefined, undefined, "dark");
        }
      );
    });

    return () => {
      cancelled = true;
      controller?.destroy();
      container.innerHTML = "";
    };
  }, [uri]);

  return (
    <div
      className={cn(
        "relative min-h-0 w-full h-full! overflow-hidden rounded-[1.5rem] bg-[#1f1f1f]",
        className
      )}
    >
      <div className="grid-action relative h-full! min-h-0 w-full">
        <div
          ref={containerRef}
          className="h-full w-full [&_iframe]:block [&_iframe]:h-full [&_iframe]:w-full [&_iframe]:border-0"
        />
      </div>
      {showDragHandle ? (
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 z-10 h-3 cursor-grab bg-transparent active:cursor-grabbing"
        />
      ) : null}
    </div>
  );
}
