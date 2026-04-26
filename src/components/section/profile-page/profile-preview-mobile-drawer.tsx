import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  ProfilePagePreview,
  ProfilePagePrimaryAction,
  ProfilePageSeeItLiveAction,
} from "./profile-page-preview";

export default function ProfilePreviewMobileDrawer() {
  return (
    <Drawer>
      <div className="grid grid-cols-2 gap-2">
        <DrawerTrigger asChild>
          <Button
            type="button"
            variant={"outline"}
            size={"lg"}
            className={"h-12 w-full text-lg font-bold! shadow-sm"}
          >
            Preview
          </Button>
        </DrawerTrigger>
        <ProfilePagePrimaryAction />
      </div>
      <DrawerContent
        aria-label="Profile page preview"
        className="h-[90vh] max-h-[90vh] overflow-hidden p-0"
      >
        <DrawerTitle className="sr-only">Profile page preview</DrawerTitle>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ProfilePagePreview framed={false} showActions={false} />
        </div>
        <DrawerFooter className="relative z-10 bg-background p-2">
          <ProfilePageSeeItLiveAction />
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
