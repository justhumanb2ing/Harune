"use client";

import { ProfilePageRenderer } from "@/components/section/profile-page/profile-page-renderer";
import { useProfilePageEditor } from "@/components/section/profile-page/use-profile-page-editor";
import { Button } from "@/components/ui/button";
import useUser from "@/lib/users/useUser";
import { Loader2 } from "lucide-react";

export function ProfilePagePreview() {
  const editor = useProfilePageEditor();
  const { user } = useUser();

  if (!editor.data) {
    return null;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 h-full bg-input p-10">
      <div className="flex items-center justify-between px-5 py-4">
        <div>leeve.li/{editor.data.page.handle}</div>
        <Button
          type="button"
          size={"lg"}
          onClick={() => void editor.handleSync()}
          disabled={!editor.hasUnsyncedChanges || editor.isSyncing}
          className={"px-6 rounded-md uppercase text-xs"}
        >
          {editor.isSyncing && <Loader2 className="size-4 animate-spin" />}
          Sync
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto max-w-[375px] mx-auto">
        <ProfilePageRenderer
          isPreview
          handle={editor.data.page.handle || "preview"}
          name={editor.data.page.name || null}
          bio={editor.data.page.bio || null}
          image={editor.previewImageSrc ?? null}
          linkItems={editor.data.linkItems}
          socialLinks={editor.data.socialLinks}
          textBoxItems={editor.data.textBoxItems}
          userName={user?.name ?? null}
        />
      </div>
    </div>
  );
}
