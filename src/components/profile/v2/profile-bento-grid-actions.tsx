import { ImagePlus, Link, MapPin, Pilcrow, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CreatableBentoType } from "./profile-bento-grid-model";
import { bentoTypeLabels, creatableBentoTypes } from "./profile-bento-grid-model";

const actionIcons = {
  link: Link,
  map: MapPin,
  section: Pilcrow,
  text: Type,
} satisfies Record<(typeof creatableBentoTypes)[number], typeof Link>;

export function ProfileBentoGridActions({
  onAddItem,
  onRequestMediaInput,
  onRequestLinkInput,
}: {
  onAddItem: (type: CreatableBentoType) => void;
  onRequestMediaInput: () => void;
  onRequestLinkInput: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {creatableBentoTypes.map((type) => (
        <Button
          key={type}
          onClick={() => {
            if (type === "link") {
              onRequestLinkInput();
              return;
            }

            onAddItem(type);
          }}
          type="button"
          variant="outline"
        >
          {(() => {
            const Icon = actionIcons[type];
            return <Icon aria-hidden className="size-4" />;
          })()}
          {bentoTypeLabels[type]}
        </Button>
      ))}
      <Button onClick={onRequestMediaInput} type="button" variant="outline">
        <ImagePlus aria-hidden className="size-4" />
        Media
      </Button>
    </div>
  );
}
