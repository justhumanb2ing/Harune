"use client";

import { ProfilePageRenderer } from "@/components/section/profile-page/profile-page-renderer";
import { useProfilePageEditor } from "@/components/section/profile-page/use-profile-page-editor";
import { Button } from "@/components/ui/button";
import useUser from "@/lib/users/useUser";
import { Loader2, RefreshCw } from "lucide-react";

export function ProfilePagePreview() {
  const editor = useProfilePageEditor();
  const { user } = useUser();

  if (!editor.data) {
    return null;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex items-center justify-between rounded-[24px] bg-background px-5 py-4 shadow-xs">
        <div>
          <p className="text-sm font-medium text-foreground">Preview</p>
          <p className="text-xs text-muted-foreground">
            {editor.hasUnsyncedChanges
              ? "로컬 변경사항이 아직 DB에 반영되지 않았습니다."
              : "로컬 상태와 DB가 동기화되어 있습니다."}
          </p>
        </div>
        <Button
          type="button"
          onClick={() => void editor.handleSync()}
          disabled={!editor.hasUnsyncedChanges || editor.isSyncing}
        >
          {editor.isSyncing ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          Sync
        </Button>
      </div>

      {editor.syncError ? (
        <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {editor.syncError}
        </p>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto rounded-[32px] bg-background shadow-xs">
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
