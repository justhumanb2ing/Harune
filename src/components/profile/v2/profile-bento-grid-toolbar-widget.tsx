"use client";

import { HandPeaceIcon } from "@phosphor-icons/react";
import { MoveLeftIcon } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { Activity, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { normalizeLinkInputUrl } from "./profile-link-input-utils";

const toolbarAssetBaseUrl = "https://cdn.harune.me/public/assets";
const toolbarWidgetIconSrc = `${toolbarAssetBaseUrl}/toolbar-widget.png?v=1`;
const spotifyProviderIconSrc = `${toolbarAssetBaseUrl}/link-provider-icon/spotify.svg`;

export type ProfileBentoGridToolbarWidgetItem = {
  activityId?: ProfileBentoGridToolbarWidgetActivityId;
  id: string;
  label: string;
  imageAlt: string;
  imageSrc: string;
  onSelect?: () => void;
};

type ProfileBentoGridToolbarWidgetActivityId = "calendar" | "music";
type ProfileBentoGridToolbarWidgetActivityDirection = "back" | "forward";

const defaultToolbarWidgetItems = [
  {
    id: "clock",
    label: "Clock",
    imageAlt: "Clock widget preview",
    imageSrc: `${toolbarAssetBaseUrl}/bento-asset/bento-clock.png`,
  },
  {
    id: "music",
    activityId: "music",
    label: "Music & Playlist",
    imageAlt: "Music and playlist widget preview",
    imageSrc: `${toolbarAssetBaseUrl}/bento-asset/bento-music.png`,
  },
  {
    id: "calendar",
    activityId: "calendar",
    label: "Calendar",
    imageAlt: "Calendar widget preview",
    imageSrc: `${toolbarAssetBaseUrl}/bento-asset/bento-calendar.png?v=1`,
  },
] as const satisfies readonly ProfileBentoGridToolbarWidgetItem[];

const widgetActivityTitleById = {
  calendar: "Calendar Widget",
  music: "Music & Playlist Widget",
} satisfies Record<ProfileBentoGridToolbarWidgetActivityId, string>;

function ProfileBentoGridToolbarWidgetCard({
  item,
  onActivitySelect,
}: {
  item: ProfileBentoGridToolbarWidgetItem;
  onActivitySelect: (activityId: ProfileBentoGridToolbarWidgetActivityId) => void;
}) {
  const content = (
    <>
      <Image
        alt={item.imageAlt}
        className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
        fill
        sizes="192px"
        src={item.imageSrc}
        unoptimized
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/75 via-black/35 to-transparent"
      />
      <p className="absolute bottom-5 left-6 z-10 text-lg font-semibold text-primary-foreground">
        {item.label}
      </p>
    </>
  );

  const className =
    "group relative aspect-square size-48 cursor-pointer overflow-hidden rounded-[2rem] border drop-shadow-sm";

  const handleSelect = item.onSelect
    ? item.onSelect
    : item.activityId
      ? () => onActivitySelect(item.activityId as ProfileBentoGridToolbarWidgetActivityId)
      : null;

  if (handleSelect) {
    return (
      <button
        aria-label={item.label}
        className={`${className} text-left`}
        type="button"
        onClick={handleSelect}
      >
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
}

export function ProfileBentoGridToolbarWidget({
  items = defaultToolbarWidgetItems,
  onClockSelect,
  onMusicLinkSubmit,
}: {
  items?: readonly ProfileBentoGridToolbarWidgetItem[];
  onClockSelect?: () => void;
  onMusicLinkSubmit?: (url: string) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [activeActivityId, setActiveActivityId] =
    useState<ProfileBentoGridToolbarWidgetActivityId | null>(null);
  const [activityDirection, setActivityDirection] =
    useState<ProfileBentoGridToolbarWidgetActivityDirection>("forward");
  const [musicUrl, setMusicUrl] = useState("");
  const [isSubmittingMusicUrl, setIsSubmittingMusicUrl] = useState(false);
  const musicInputRef = useRef<HTMLInputElement>(null);
  const shouldReduceMotion = Boolean(useReducedMotion());
  const nextItems = items.map((item) =>
    item.id === "clock" && onClockSelect
      ? {
          ...item,
          onSelect: () => {
            onClockSelect();
            setOpen(false);
          },
        }
      : item
  );
  const activeActivityTitle = activeActivityId
    ? widgetActivityTitleById[activeActivityId]
    : "Widgets";
  const selectActivity = (activityId: ProfileBentoGridToolbarWidgetActivityId) => {
    setActivityDirection("forward");
    setActiveActivityId(activityId);
  };
  const backToActivityList = () => {
    setActivityDirection("back");
    setActiveActivityId(null);
  };

  useEffect(() => {
    if (!open) {
      setActiveActivityId(null);
      setMusicUrl("");
      setIsSubmittingMusicUrl(false);
      return;
    }

    if (activeActivityId !== "music") {
      return;
    }

    const frame = requestAnimationFrame(() => {
      musicInputRef.current?.focus();
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [activeActivityId, open]);

  const handleMusicSubmit = async (inputUrl = musicUrl) => {
    if (!onMusicLinkSubmit || isSubmittingMusicUrl) {
      return;
    }

    const rawUrl = normalizeLinkInputUrl(inputUrl);

    if (!rawUrl) {
      return;
    }

    setIsSubmittingMusicUrl(true);

    try {
      const didCreateItem = await onMusicLinkSubmit(rawUrl);

      if (didCreateItem) {
        setMusicUrl("");
        setOpen(false);
      }
    } finally {
      setIsSubmittingMusicUrl(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger
          render={
            <DialogTrigger
              render={
                <Button
                  aria-label="Open widget dialog"
                  type="button"
                  variant="ghost"
                  size={"icon-sm"}
                  className={
                    "surface-bevel border-0 overflow-hidden bg-secondary/80 shadow-none hover:bg-secondary/80"
                  }
                >
                  <Image
                    alt=""
                    aria-hidden
                    className="size-full object-cover"
                    height={120}
                    src={toolbarWidgetIconSrc}
                    width={120}
                    unoptimized
                  />
                </Button>
              }
            />
          }
        />
        <TooltipContent side="top" sideOffset={8}>
          Widget
        </TooltipContent>
      </Tooltip>
      <DialogContent
        showCloseButton={false}
        className="flex h-[600px] max-h-[80vh] flex-col overflow-hidden rounded-[3rem] p-8 px-6 drop-shadow-2xl shadow-float-lg sm:max-w-md"
      >
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <AnimatePresence custom={activityDirection} initial={false} mode="sync">
            {activeActivityId === null ? (
              <motion.div
                animate={{ opacity: 1, x: 0 }}
                className="absolute inset-0 flex min-h-0 flex-col gap-4"
                custom={activityDirection}
                exit={{
                  opacity: shouldReduceMotion ? 1 : 0,
                  x: shouldReduceMotion ? 0 : activityDirection === "forward" ? -28 : 28,
                }}
                initial={{
                  opacity: shouldReduceMotion ? 1 : 0,
                  x: shouldReduceMotion ? 0 : activityDirection === "back" ? -28 : 28,
                }}
                key="widget-list"
                transition={{ duration: shouldReduceMotion ? 0 : 0.24, ease: [0.2, 0, 0, 1] }}
              >
                <DialogHeader className="mb-1 min-h-9 gap-2 flex-row items-center">
                  <DialogTitle className="text-2xl font-bold">Widgets</DialogTitle>
                  <DialogDescription className="hidden" />
                </DialogHeader>
                <Activity mode="visible" name="Widget list">
                  <div className="flex min-h-0 flex-1 flex-col gap-4">
                    <div className="p-4 rounded-3xl bg-secondary/80 flex items-center gap-2">
                      <div className="size-8 rounded-full bg-background shadow-float drop-shadow-xs p-1 flex items-center justify-center">
                        <HandPeaceIcon className="size-5.5 text-indigo-400" weight="duotone" />
                      </div>
                      <div className="text-neutral-600 text-xs">
                        <p>You can enrich your page with widgets.</p>
                        <p>More advanced widgets are currently in development.</p>
                      </div>
                    </div>
                    <section className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-1">
                      <div className="grid grid-cols-2 gap-4">
                        {nextItems.map((item) => (
                          <ProfileBentoGridToolbarWidgetCard
                            key={item.id}
                            item={item}
                            onActivitySelect={selectActivity}
                          />
                        ))}
                      </div>
                    </section>
                  </div>
                </Activity>
              </motion.div>
            ) : (
              <motion.div
                animate={{ opacity: 1, x: 0 }}
                className="absolute inset-0 flex min-h-0 flex-col gap-4"
                custom={activityDirection}
                exit={{
                  opacity: shouldReduceMotion ? 1 : 0,
                  x: shouldReduceMotion ? 0 : activityDirection === "back" ? 28 : -28,
                }}
                initial={{
                  opacity: shouldReduceMotion ? 1 : 0,
                  x: shouldReduceMotion ? 0 : activityDirection === "forward" ? 28 : -28,
                }}
                key={`widget-detail-${activeActivityId}`}
                transition={{ duration: shouldReduceMotion ? 0 : 0.24, ease: [0.2, 0, 0, 1] }}
              >
                <DialogHeader className="mb-1 min-h-9 gap-2 flex-row items-center">
                  <Button
                    aria-label="Back to widgets"
                    className="size-9 rounded-full border-0 p-0 shadow-none hover:bg-inherit"
                    onClick={backToActivityList}
                    size="icon"
                    type="button"
                    variant="ghost"
                  >
                    <MoveLeftIcon aria-hidden className="size-5" />
                  </Button>
                  <DialogTitle className="text-2xl font-bold">{activeActivityTitle}</DialogTitle>
                  <DialogDescription className="hidden" />
                </DialogHeader>
                <Activity mode="visible" name="Widget detail">
                  <div className="flex min-h-0 flex-1 flex-col gap-4">
                    {activeActivityId === "music" ? (
                      <>
                        <form
                          onSubmit={(event) => {
                            event.preventDefault();
                            void handleMusicSubmit();
                          }}
                        >
                          <Field className="relative rounded-lg !bg-inherit py-1 outline-none">
                            <InputGroup className="border-0 !bg-inherit ring-0 has-[[data-slot=input-group-control]:focus-visible]:border-transparent has-[[data-slot=input-group-control]:focus-visible]:ring-0">
                              <InputGroupInput
                                aria-label="Music or playlist URL"
                                className="text-sm! h-10 px-1"
                                disabled={isSubmittingMusicUrl || !onMusicLinkSubmit}
                                onChange={(event) => setMusicUrl(event.target.value)}
                                onKeyDown={(event) => {
                                  if (event.key !== "Enter") {
                                    return;
                                  }

                                  event.preventDefault();
                                  void handleMusicSubmit();
                                }}
                                onPaste={(event) => {
                                  if (isSubmittingMusicUrl) {
                                    return;
                                  }

                                  const pastedText = event.clipboardData
                                    .getData("text/plain")
                                    .trim();

                                  if (!pastedText) {
                                    return;
                                  }

                                  event.preventDefault();
                                  void handleMusicSubmit(pastedText);
                                }}
                                placeholder="https://open.spotify.com/..."
                                ref={musicInputRef}
                                value={musicUrl}
                              />
                              <InputGroupAddon align="inline-end" className="pr-2">
                                <InputGroupButton
                                  aria-label="Fetch music embed details"
                                  className="h-8 border-0 bg-background px-3 font-semibold text-base text-black shadow-sm"
                                  disabled={
                                    isSubmittingMusicUrl || !musicUrl.trim() || !onMusicLinkSubmit
                                  }
                                  type="submit"
                                  variant="outline"
                                >
                                  {isSubmittingMusicUrl ? (
                                    <span>Getting...</span>
                                  ) : (
                                    <span>Get</span>
                                  )}
                                </InputGroupButton>
                              </InputGroupAddon>
                            </InputGroup>
                          </Field>
                        </form>
                        <div className="mt-auto flex flex-col gap-3 rounded-3xl bg-secondary/50 p-4">
                          <p className="font-medium text-sm">Available provider</p>
                          <div className="flex size-8 items-center justify-center rounded-full overflow-hidden bg-background">
                            <Image
                              alt="Spotify"
                              className="size-full"
                              height={24}
                              src={spotifyProviderIconSrc}
                              width={24}
                              unoptimized
                            />
                          </div>
                        </div>
                      </>
                    ) : null}
                    {activeActivityId === "calendar" ? (
                      <div className="p-4 rounded-3xl bg-secondary/80 flex items-center gap-2">
                        <div className="size-8 rounded-full bg-background shadow-float drop-shadow-xs p-1 flex items-center justify-center">
                          <HandPeaceIcon className="size-5.5 text-indigo-400" weight="duotone" />
                        </div>
                        <p className="text-neutral-600">Calendar widget currently in progress...</p>
                      </div>
                    ) : null}
                  </div>
                </Activity>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
