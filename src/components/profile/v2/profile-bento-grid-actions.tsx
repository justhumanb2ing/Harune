import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { CreatableBentoType } from "./profile-bento-grid-model";
import { bentoTypeLabels, creatableBentoTypes } from "./profile-bento-grid-model";

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
}: {
  onAddItem: (type: CreatableBentoType) => void;
  onRequestMediaInput: () => void;
  onToggleLinkInput: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
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
    </div>
  );
}
