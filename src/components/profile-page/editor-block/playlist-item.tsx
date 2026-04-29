"use client";

import { Music4Icon } from "lucide-react";
import { AnimatePresence, MotionConfig, motion, type Transition } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { ColorAppleMusicIcon, ColorSoundcloudIcon, ColorSpotifyIcon } from "@/components/icons";
import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { useIsBelowLg } from "@/hooks/use-mobile";
import {
  type IframelyResponse,
  resolvePlaylistDraftFromIframely,
} from "@/lib/profile-page/iframely";
import type { PlaylistProvider } from "@/lib/profile-page/playlist";
import { cn } from "@/lib/utils";

const sectionLinkClassName =
  "group/item flex w-full flex-wrap gap-2.5 rounded-2xl bg-background px-4 py-3 text-sm transition-colors outline-none hover:bg-background! focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 hover:bg-secondary/30!";

const COLLAPSED_HEIGHT = 128;
const EXPANDED_HEIGHT = 224;
const BOX_RADIUS = 16;

const EMPHASIZED_EASE = [0.22, 1, 0.36, 1] as const;
const EXIT_EASE = [0.4, 0, 1, 1] as const;

const shellExpandTransition: Transition = {
  height: {
    type: "spring",
    stiffness: 420,
    damping: 22,
    mass: 0.78,
  },
  borderRadius: {
    type: "spring",
    stiffness: 420,
    damping: 22,
    mass: 0.78,
  },
  scale: {
    duration: 0.34,
    ease: EMPHASIZED_EASE,
    times: [0, 0.55, 1],
  },
  y: {
    duration: 0.34,
    ease: EMPHASIZED_EASE,
    times: [0, 0.55, 1],
  },
};

const shellCollapseTransition: Transition = {
  height: {
    type: "spring",
    stiffness: 500,
    damping: 34,
    mass: 0.85,
  },
  borderRadius: {
    type: "spring",
    stiffness: 500,
    damping: 34,
    mass: 0.85,
  },
  scale: {
    duration: 0.18,
    ease: EXIT_EASE,
  },
  y: {
    duration: 0.18,
    ease: EXIT_EASE,
  },
};

const panelTransition: Transition = {
  delay: 0.06,
  duration: 0.28,
  ease: EMPHASIZED_EASE,
};

const panelExitTransition: Transition = {
  duration: 0.16,
  ease: EXIT_EASE,
};

type PlaylistItemProps = {
  onAdd: (playlist: { content: string; provider: PlaylistProvider; title: string }) => void;
};

const providerIcons = [
  { icon: ColorSpotifyIcon, label: "Spotify" },
  { icon: ColorSoundcloudIcon, label: "SoundCloud" },
  { icon: ColorAppleMusicIcon, label: "Apple Music - 웹 플레이어" },
] as const;

export function PlaylistItem({ onAdd }: PlaylistItemProps) {
  const isBelowLg = useIsBelowLg();
  const [isExpanded, setIsExpanded] = useState(false);
  const [url, setUrl] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const canAdd = url.trim().length > 0 && !isAdding;

  const reset = () => {
    setUrl("");
    setIsExpanded(false);
    setIsAdding(false);
  };

  const handleAdd = async () => {
    const trimmedUrl = url.trim();

    if (!trimmedUrl || isAdding) {
      return;
    }

    let parsedUrl: URL;

    try {
      parsedUrl = new URL(trimmedUrl);
    } catch {
      toast.error("Enter a valid URL");
      return;
    }

    try {
      setIsAdding(true);
      const searchParams = new URLSearchParams({ url: parsedUrl.toString() });
      const response = await fetch(`/api/app/profile-page/playlist?${searchParams.toString()}`, {
        cache: "no-store",
      });
      const body = (await response.json()) as IframelyResponse;

      if (!response.ok) {
        const message = "error" in body ? body.error.message : "Failed to fetch playlist";
        throw new Error(message);
      }

      const nextPlaylist = resolvePlaylistDraftFromIframely(body);
      onAdd(nextPlaylist);
      reset();
    } catch (error) {
      const message =
        error instanceof Error ? error.message.replace(/\./g, "") : "Failed to fetch playlist";
      toast.error(message);
    } finally {
      setIsAdding(false);
    }
  };

  const formHeader = (
    <div className="grid grid-cols-3 items-center px-1 py-1">
      <Button
        type="button"
        size="lg"
        variant="outline"
        onClick={reset}
        className="h-10 justify-self-start rounded-md border-border/60 px-4 text-base font-semibold shadow-sm"
      >
        Cancel
      </Button>
      <p className="justify-self-center text-xl font-semibold">Playlist</p>
      <Button
        type="button"
        size="lg"
        variant="outline"
        disabled={!canAdd}
        onClick={() => void handleAdd()}
        className="brand-success-button h-10 justify-self-end rounded-md border px-6 text-base font-semibold text-primary-foreground shadow-sm hover:text-primary-foreground"
      >
        {isAdding ? "Adding..." : "Add"}
      </Button>
    </div>
  );

  const formFields = (
    <div className="space-y-0 p-1">
      <Input
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        placeholder="https://open.spotify.com/playlist/..."
        className="h-11 w-full min-w-0 max-w-full border-0 text-lg! font-medium focus-visible:ring-0"
      />
    </div>
  );

  const collapsedContent = (
    <div className="flex w-full flex-col justify-between">
      <p className="flex flex-1 flex-col gap-1">
        <span className="flex w-fit items-center gap-2 text-xl leading-snug font-semibold">
          <Music4Icon className="size-6" />
          <span>Playlist</span>
        </span>
      </p>
      <AvatarGroup className="px-1">
        {providerIcons.map(({ icon: Icon, label }) => (
          <Avatar key={label} size="lg">
            <AvatarFallback className="bg-secondary">
              <Icon className="size-6" aria-hidden="true" />
            </AvatarFallback>
          </Avatar>
        ))}
      </AvatarGroup>
    </div>
  );

  if (isBelowLg) {
    return (
      <>
        <div className="h-32 w-full overflow-hidden rounded-2xl bg-background shadow-float">
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className={cn(sectionLinkClassName, "h-full text-left")}
          >
            {collapsedContent}
          </button>
        </div>
        <Drawer
          open={isExpanded}
          onOpenChange={(open) => {
            if (open) {
              setIsExpanded(true);
              return;
            }

            reset();
          }}
        >
          <DrawerContent
            aria-label="Add playlist"
            className="max-h-[85vh] min-h-[50vh] gap-0 rounded-t-2xl p-0 pt-1"
          >
            <DrawerTitle className="sr-only">Add playlist</DrawerTitle>
            <div className="flex min-h-0 flex-col overflow-y-auto bg-background p-2">
              {formHeader}
              <div className="min-w-0 flex-1 overflow-hidden">{formFields}</div>
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <MotionConfig transition={shellExpandTransition}>
      <motion.div
        animate={{
          height: isExpanded ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT,
          borderRadius: BOX_RADIUS,
          scale: isExpanded ? [1, 1.018, 1] : 1,
          y: isExpanded ? [0, -3, 0] : 0,
        }}
        transition={isExpanded ? shellExpandTransition : shellCollapseTransition}
        className="w-full overflow-hidden bg-background shadow-float"
      >
        <AnimatePresence initial={false} mode="sync">
          {isExpanded ? (
            <motion.div
              key="playlist-block-expanded"
              initial={{ opacity: 0, y: 18, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{
                opacity: 0,
                y: 16,
                filter: "blur(8px)",
                transition: panelExitTransition,
              }}
              transition={panelTransition}
              className="flex h-full min-h-0 flex-col overflow-hidden bg-background p-2"
            >
              {formHeader}
              <motion.div
                initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{
                  opacity: 0,
                  y: 8,
                  filter: "blur(6px)",
                  transition: panelExitTransition,
                }}
                transition={panelTransition}
                className="min-w-0 flex-1 overflow-hidden"
              >
                {formFields}
              </motion.div>
            </motion.div>
          ) : (
            <motion.button
              key="playlist-block-collapsed"
              type="button"
              initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{
                opacity: 0,
                y: 16,
                filter: "blur(8px)",
                transition: panelExitTransition,
              }}
              transition={panelTransition}
              onClick={() => setIsExpanded(true)}
              className={cn(sectionLinkClassName, "h-full text-left")}
            >
              {collapsedContent}
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </MotionConfig>
  );
}
