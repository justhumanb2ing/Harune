"use client";

import { ProfilePageRenderer } from "@/components/section/profile-page/profile-page-renderer";
import { useProfilePageEditor } from "@/components/section/profile-page/use-profile-page-editor";
import { Button } from "@/components/ui/button";
import { appConfig } from "@/lib/config";
import useUser from "@/lib/users/useUser";
import { CheckIcon, ChevronRightIcon, CopyIcon, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export function ProfilePagePreview() {
  const editor = useProfilePageEditor();
  const { user } = useUser();
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: 0.8,
        ease: "easeInOut",
      }}
      className="relative flex h-full min-h-0 flex-1 flex-col gap-4 p-10 bg-input"
    >
      <div
        className="absolute inset-0 scale-105 blur-xl"
        style={{
          backgroundImage: editor.previewImageSrc ? `url(${editor.previewImageSrc})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between py-4 w-[375px] mx-auto">
          <div className="group/share flex items-center justify-center min-w-32 h-10 overflow-hidden rounded-md bg-foreground text-primary-foreground shadow-sm transition-all duration-300">
            <Button
              nativeButton={false}
              className={"px-4 py-3 font-bold text-base"}
              render={
                <Link href={`/${editor.data.page.handle}`} className="min-w-0">
                  <p className="truncate line-clamp-1">Preview</p>
                  <ChevronRightIcon className="stroke-3 size-4" />
                </Link>
              }
            />
          </div>
          <Button
            type="button"
            size={"lg"}
            onClick={() => void handlePrimaryAction()}
            disabled={editor.isSyncing}
            className={"brand-success-button px-6 h-10 rounded-md font-bold text-base min-w-32"}
          >
            {editor.isSyncing && <Loader2 className="size-4 animate-spin" />}
            {editor.hasUnsyncedChanges ? (
              <span>Sync</span>
            ) : (
              <>
                {isCopied ? (
                  <CheckIcon className="size-4" />
                ) : (
                  <CopyIcon className="size-4 stroke-3" />
                )}
                <span>{isCopied ? "Copied" : "Share"}</span>
              </>
            )}
          </Button>
        </div>

        <div className="mx-auto min-h-0 w-[375px] flex-1">
          <ProfilePageRenderer
            isPreview
            backgroundImage={editor.previewBackgroundImageSrc ?? null}
            handle={editor.data.page.handle || "preview"}
            name={editor.data.page.name || null}
            bio={editor.data.page.bio || null}
            image={editor.previewImageSrc ?? null}
            linkBlockPosition={editor.data.page.linkBlockPosition}
            linkItems={editor.data.linkItems}
            location={editor.data.page.location || null}
            socialLinks={editor.data.socialLinks}
            role={editor.data.page.role || null}
            textBoxItems={editor.data.textBoxItems}
            userName={user?.name ?? null}
          />
        </div>
      </div>
    </motion.div>
  );
}
