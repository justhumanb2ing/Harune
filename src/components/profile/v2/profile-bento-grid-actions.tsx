"use client";

import { LaptopIcon, SmartphoneIcon } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { CreatableBentoType } from "./profile-bento-grid-model";
import { bentoTypeLabels, creatableBentoTypes } from "./profile-bento-grid-model";

export type ProfileBentoGridPreviewMode = "desktop" | "mobile";

const toolbarAssetBaseUrl = "https://cdn.harune.me/public/assets";
const toolbarIconSrcByType: Record<CreatableBentoType, string> = {
  link: `${toolbarAssetBaseUrl}/toolbar-link.png`,
  text: `${toolbarAssetBaseUrl}/toolbar-text.png`,
  map: `${toolbarAssetBaseUrl}/toolbar-map.png`,
  section: `${toolbarAssetBaseUrl}/toolbar-section.png`,
  media: `${toolbarAssetBaseUrl}/toolbar-media.png`,
};

export function ProfileBentoGridActions({
  onAddItem,
  onRequestMediaInput,
  onToggleLinkInput,
  onPreviewModeChange,
  previewMode,
}: {
  onAddItem: (type: CreatableBentoType) => void;
  onRequestMediaInput: () => void;
  onToggleLinkInput: () => void;
  onPreviewModeChange: (mode: ProfileBentoGridPreviewMode) => void;
  previewMode: ProfileBentoGridPreviewMode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {creatableBentoTypes.map((type) => (
        <Tooltip key={type}>
          <TooltipTrigger
            render={
              <Button
                aria-label={`Add ${bentoTypeLabels[type]}`}
                onClick={() => {
                  if (type === "link") {
                    onToggleLinkInput();
                    return;
                  }

                  if (type === "media") {
                    onRequestMediaInput();
                    return;
                  }

                  onAddItem(type);
                }}
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
                  src={toolbarIconSrcByType[type]}
                  className="size-full object-cover"
                  height={120}
                  width={120}
                  unoptimized
                />
              </Button>
            }
          />
          <TooltipContent side="top" sideOffset={8}>
            {bentoTypeLabels[type]}
          </TooltipContent>
        </Tooltip>
      ))}
      <div className="hidden items-center gap-2 2xl:flex">
        <Separator
          orientation="vertical"
          className={"data-vertical:w-[3px] my-2.5 rounded-lg mx-2"}
        />
        <ToggleGroup
          aria-label="Preview device"
          className="flex-nowrap"
          multiple={false}
          onValueChange={(nextValue) => {
            const nextMode = nextValue[nextValue.length - 1];

            if (nextMode === "desktop" || nextMode === "mobile") {
              onPreviewModeChange(nextMode);
            }
          }}
          size="lg"
          spacing={1}
          value={[previewMode]}
          variant="default"
        >
          <Tooltip>
            <TooltipTrigger
              render={
                <ToggleGroupItem
                  aria-label="Desktop preview"
                  className="h-9 px-5 rounded-md bg-transparent text-foreground shadow-none hover:bg-transparent data-[state=on]:bg-black data-[state=on]:text-white aria-pressed:bg-black aria-pressed:text-white"
                  type="button"
                  value="desktop"
                >
                  <LaptopIcon aria-hidden className="size-5 stroke-[2.5px]" />
                </ToggleGroupItem>
              }
            />
            <TooltipContent side="top" sideOffset={8}>
              Desktop
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <ToggleGroupItem
                  aria-label="Mobile preview"
                  className="h-9 px-5 rounded-md bg-transparent text-foreground shadow-none hover:bg-transparent data-[state=on]:bg-black data-[state=on]:text-white aria-pressed:bg-black aria-pressed:text-white"
                  type="button"
                  value="mobile"
                >
                  <SmartphoneIcon aria-hidden className="size-5 stroke-[2.5px]" />
                </ToggleGroupItem>
              }
            />
            <TooltipContent side="top" sideOffset={8}>
              Mobile
            </TooltipContent>
          </Tooltip>
        </ToggleGroup>
      </div>
    </div>
  );
}
