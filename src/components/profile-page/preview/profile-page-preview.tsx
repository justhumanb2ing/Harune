"use client";

import { CheckIcon, CopyIcon, Loader2, SmartphoneIcon } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ProfilePageRenderer } from "@/components/profile-page/preview/profile-page-renderer";
import { Button } from "@/components/ui/button";
import { useProfilePageEditor } from "@/hooks/use-profile-page-editor";
import { appConfig } from "@/lib/config";
import useUser from "@/lib/users/use-user";
import { cn } from "@/lib/utils";

type ProfilePagePreviewProps = {
  framed?: boolean;
  showActions?: boolean;
};

export function ProfilePageSeeItLiveAction() {
  const editor = useProfilePageEditor();

  if (!editor.data) {
    return null;
  }

  return (
    <Button
      type="button"
      nativeButton={false}
      size={"lg"}
      variant={"outline"}
      className={"w-full px-6 h-12 rounded-md font-bold text-lg! min-w-32 shadow-sm"}
      render={
        <Link href={`/${editor.data.page.handle}`} className="min-w-0">
          <SmartphoneIcon className="stroke-3 size-4" />
          <p className="truncate line-clamp-1">See it live</p>
        </Link>
      }
    />
  );
}

export function ProfilePagePrimaryAction() {
  const editor = useProfilePageEditor();
  const [isCopied, setIsCopied] = useState(false);
  const pageUrl = useMemo(() => {
    if (!editor.data?.page.handle) {
      return "";
    }

    return `${appConfig.url}/${editor.data.page.handle}`;
  }, [editor.data?.page.handle]);

  useEffect(() => {
    if (!isCopied) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setIsCopied(false);
    }, 1800);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [isCopied]);

  const handleCopyPageUrl = async () => {
    if (!pageUrl) {
      return;
    }

    await navigator.clipboard.writeText(pageUrl);
    setIsCopied(true);
  };

  const handlePrimaryAction = async () => {
    if (editor.hasUnsyncedChanges) {
      await editor.handleSync();
      return;
    }

    await handleCopyPageUrl();
  };

  if (!editor.data) {
    return null;
  }

  return (
    <Button
      type="button"
      size={"lg"}
      onClick={() => void handlePrimaryAction()}
      disabled={editor.isSyncing}
      className={"w-full brand-button px-6 h-12 rounded-md font-bold text-lg! min-w-0"}
    >
      {editor.isSyncing && <Loader2 className="size-4 animate-spin" />}
      {editor.hasUnsyncedChanges ? (
        <span>Sync</span>
      ) : (
        <>
          {isCopied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4 stroke-3" />}
          <span>{isCopied ? "Copied" : "Share"}</span>
        </>
      )}
    </Button>
  );
}

export function ProfilePagePreviewActions() {
  return (
    <>
      <ProfilePageSeeItLiveAction />
      <ProfilePagePrimaryAction />
    </>
  );
}

export function ProfilePagePreview({ framed = true, showActions = true }: ProfilePagePreviewProps) {
  const editor = useProfilePageEditor();
  const { user } = useUser();

  if (!editor.data) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: 0.8,
        ease: "easeInOut",
      }}
      className={cn(
        "relative flex min-h-0 flex-1 flex-col gap-4",
        framed ? "h-full p-10" : "h-auto min-h-full p-0"
      )}
    >
      {framed ? <div className="absolute inset-0 scale-105 blur-xl" /> : null}
      <div className={cn("relative z-10 flex flex-col", framed ? "h-full" : "h-auto min-h-full")}>
        <div className={cn("mx-auto min-h-0 w-full max-w-[375px]", framed ? "flex-1" : "shrink-0")}>
          <ProfilePageRenderer
            framed={framed}
            isPreview
            backgroundImage={editor.previewBackgroundImageSrc ?? null}
            handle={editor.data.page.handle || "preview"}
            name={editor.data.page.name || null}
            bio={editor.data.page.bio || null}
            image={editor.previewImageSrc ?? null}
            linkBlockPosition={editor.data.page.linkBlockPosition}
            linkItems={editor.data.linkItems}
            playlistItems={editor.data.playlistItems}
            location={editor.data.page.location || null}
            socialLinks={editor.data.socialLinks}
            role={editor.data.page.role || null}
            textBoxItems={editor.data.textBoxItems}
            userName={user?.name ?? null}
          />
        </div>

        {showActions ? (
          <div className="flex flex-col gap-2 items-center justify-between w-[375px] max-w-full mx-auto">
            <ProfilePagePreviewActions />
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}
