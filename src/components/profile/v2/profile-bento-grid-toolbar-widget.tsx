"use client";

import { HandPeaceIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const toolbarAssetBaseUrl = "https://cdn.harune.me/public/assets";
const toolbarWidgetIconSrc = `${toolbarAssetBaseUrl}/toolbar-widget.png?v=1`;

export type ProfileBentoGridToolbarWidgetItem = {
  id: string;
  label: string;
  imageAlt: string;
  imageSrc: string;
  onSelect?: () => void;
};

const defaultToolbarWidgetItems = [
  {
    id: "clock",
    label: "Clock",
    imageAlt: "Clock widget preview",
    imageSrc: `${toolbarAssetBaseUrl}/bento-asset/bento-clock.png`,
  },
  {
    id: "music",
    label: "Music & Playlist",
    imageAlt: "Music and playlist widget preview",
    imageSrc: `${toolbarAssetBaseUrl}/bento-asset/bento-music.png`,
  },
  {
    id: "calendar",
    label: "Calendar",
    imageAlt: "Calendar widget preview",
    imageSrc: `${toolbarAssetBaseUrl}/bento-asset/bento-calendar.png?v=1`,
  },
] as const satisfies readonly ProfileBentoGridToolbarWidgetItem[];

function ProfileBentoGridToolbarWidgetCard({ item }: { item: ProfileBentoGridToolbarWidgetItem }) {
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

  if (item.onSelect) {
    return (
      <button
        aria-label={item.label}
        className={`${className} text-left`}
        type="button"
        onClick={item.onSelect}
      >
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
}

export function ProfileBentoGridToolbarWidget({
  items = defaultToolbarWidgetItems,
}: {
  items?: readonly ProfileBentoGridToolbarWidgetItem[];
}) {
  return (
    <Dialog>
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
        className="flex max-h-[80vh] flex-col overflow-hidden rounded-[3rem] p-8 px-6 drop-shadow-2xl shadow-float-lg sm:max-w-md"
      >
        <DialogHeader className="mb-1 gap-1 flex-row items-center">
          <DialogTitle className="px-3 text-2xl font-bold">Widgets</DialogTitle>
          <DialogDescription className="hidden" />
        </DialogHeader>
        <div className="p-4 rounded-3xl bg-secondary/80 flex items-center gap-2">
          <div className="size-8 rounded-full bg-background shadow-float drop-shadow-xs p-1 flex items-center justify-center">
            <HandPeaceIcon className="size-5.5 text-indigo-400" weight="duotone" />
          </div>

          <p className="text-neutral-600">Widgets currently in progress...</p>
        </div>
        <section className="min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-4">
            {items.map((item) => (
              <ProfileBentoGridToolbarWidgetCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      </DialogContent>
    </Dialog>
  );
}
