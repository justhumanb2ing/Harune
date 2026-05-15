"use client";

import { Plus } from "lucide-react";
import Image from "next/image";
import type { CSSProperties } from "react";
import type { LayoutItem } from "react-grid-layout";
import { createLayoutItem } from "@/lib/grid/grid-layout-utils";
import type { GridBreakpoint, GridItem, GridLayouts } from "@/lib/grid/grid-types";
import { cn } from "@/lib/utils";
import type { CreatableBentoType } from "./profile-bento-grid-model";

const toolbarAssetBaseUrl = "https://cdn.harune.me/public/assets";
const toolbarIconSrcByType: Record<CreatableBentoType, string> = {
  link: `${toolbarAssetBaseUrl}/toolbar-link.png`,
  text: `${toolbarAssetBaseUrl}/toolbar-text.png`,
  map: `${toolbarAssetBaseUrl}/toolbar-map.png`,
  section: `${toolbarAssetBaseUrl}/toolbar-section.png`,
  media: `${toolbarAssetBaseUrl}/toolbar-media.png`,
};

const suggestionLabelByType: Record<CreatableBentoType, string> = {
  link: "Add Link",
  map: "Add Map",
  media: "Add Media",
  section: "Add Section",
  text: "Add Text",
};

export const PROFILE_BENTO_SUGGESTION_ITEM_ID_PREFIX = "suggestion:";

export const profileBentoSuggestionItemId = (type: CreatableBentoType) =>
  `${PROFILE_BENTO_SUGGESTION_ITEM_ID_PREFIX}${type}`;

export const getProfileBentoSuggestionGridItems = (hiddenTypes?: ReadonlySet<CreatableBentoType>) =>
  (Object.keys(toolbarIconSrcByType) as CreatableBentoType[])
    .filter((type) => !hiddenTypes?.has(type))
    .map((type) => ({
      id: profileBentoSuggestionItemId(type),
      itemType: type,
      label: suggestionLabelByType[type],
      description: "Suggestion",
    })) satisfies GridItem[];

const suggestionTypeSizes = {
  link: { w: 2, h: 2 },
  text: { w: 1, h: 2 },
  media: { w: 1, h: 4 },
  map: { w: 2, h: 4 },
  section: { w: 4, h: 2 },
} satisfies Record<CreatableBentoType, { h?: number; w?: number }>;

export const getProfileBentoSuggestionLayouts = (
  actualLayouts: GridLayouts,
  hiddenTypes?: ReadonlySet<CreatableBentoType>
): GridLayouts => {
  const buildLayouts = (breakpoint: GridBreakpoint) => {
    const nextLayouts = [...(actualLayouts[breakpoint] ?? [])];
    const suggestionLayouts: LayoutItem[] = [];

    for (const type of getProfileBentoSuggestionGridItems(hiddenTypes).map(
      (item) => item.itemType as CreatableBentoType
    )) {
      const size = suggestionTypeSizes[type];
      const layout = createLayoutItem(profileBentoSuggestionItemId(type), breakpoint, nextLayouts, {
        itemType: type,
        h: size.h,
        w: size.w,
      });

      const suggestionLayout = {
        ...layout,
        isDraggable: false,
        isResizable: false,
      };

      nextLayouts.push(suggestionLayout);
      suggestionLayouts.push(suggestionLayout);
    }

    return suggestionLayouts;
  };

  return {
    desktop: buildLayouts("desktop"),
    compact: buildLayouts("compact"),
  };
};

export function ProfileBentoSuggestionCard({
  activeBreakpoint,
  isActive = false,
  onAddItem,
  onRequestLinkInput,
  onRequestMediaInput,
  type,
}: {
  activeBreakpoint: GridBreakpoint;
  isActive?: boolean;
  onAddItem: (type: Exclude<CreatableBentoType, "link" | "media">) => void;
  onRequestLinkInput: () => void;
  onRequestMediaInput: () => void;
  type: CreatableBentoType;
}) {
  const isSectionSuggestion = type === "section";
  const isClickable = type !== "link";
  const handleClick = () => {
    if (type === "link") {
      onRequestLinkInput();
      return;
    }

    if (type === "text" || type === "map" || type === "section") {
      onAddItem(type);
      return;
    }

    if (type === "media") {
      onRequestMediaInput();
    }
  };
  const style = isSectionSuggestion
    ? ({
        height: "calc(100% - 6rem)",
        marginBottom: "1.5rem",
        marginTop: "1.5rem",
      } as CSSProperties)
    : undefined;

  return (
    <button
      aria-label={suggestionLabelByType[type]}
      className={cn(
        "group grid-action pointer-events-auto relative h-full w-full overflow-hidden shadow-none transition-colors duration-200 ease-out hover:bg-secondary/60",
        isActive
          ? "border-3 border-black bg-[#fcfcfc] shadow-float"
          : "border-[3.5px] border-dashed border-border/70 bg-[#fcfcfc]",
        isSectionSuggestion ? "rounded-2xl" : "rounded-[1.5rem]",
        isClickable || type === "link" ? "cursor-pointer" : "cursor-default",
        activeBreakpoint === "compact" ? "min-w-0" : ""
      )}
      disabled={type !== "link" && !isClickable}
      onClick={handleClick}
      style={style}
      type="button"
    >
      <Plus
        aria-hidden
        className="absolute top-3 right-3 size-5 stroke-3 text-neutral-400 transition-transform duration-200 group-hover:scale-110"
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="surface-bevel rounded-md overflow-hidden">
            <Image
              alt=""
              aria-hidden
              className="size-6 object-cover"
              height={120}
              src={toolbarIconSrcByType[type]}
              width={120}
              unoptimized
            />
          </div>

          <span className="whitespace-nowrap text-sm font-bold leading-none text-foreground/80">
            {suggestionLabelByType[type]}
          </span>
        </div>
      </div>
    </button>
  );
}
