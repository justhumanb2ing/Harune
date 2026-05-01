import { Button } from "@/components/ui/button";
import type { CreatableBentoType } from "./profile-bento-grid-model";
import { bentoTypeLabels, creatableBentoTypes } from "./profile-bento-grid-model";

export function ProfileBentoGridActions({
  onAddItem,
}: {
  onAddItem: (type: CreatableBentoType) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {creatableBentoTypes.map((type) => (
        <Button key={type} onClick={() => onAddItem(type)} type="button" variant="outline">
          Add {bentoTypeLabels[type]}
        </Button>
      ))}
    </div>
  );
}
