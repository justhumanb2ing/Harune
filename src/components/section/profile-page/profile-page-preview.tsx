"use client";

import { ProfilePageRenderer } from "@/components/section/profile-page/profile-page-renderer";
import { useProfilePageEditor } from "@/components/section/profile-page/use-profile-page-editor";
import { Button } from "@/components/ui/button";
import { appConfig } from "@/lib/config";
import useUser from "@/lib/users/useUser";
import { CheckIcon, CopyIcon, Loader2 } from "lucide-react";
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
      className="relative flex h-full min-h-0 flex-1 flex-col gap-4 p-10"
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
        <div className="flex items-center justify-between px-5 py-4">
          <div className="group/share flex items-center justify-center min-w-32 h-10 overflow-hidden rounded-md bg-foreground text-primary-foreground shadow-sm transition-all duration-300">
            <Link
              href={`/${editor.data.page.handle}`}
              className="flex items-center gap-1 px-4 py-3 font-medium text-sm justify-center"
            >
              <span>leeve.li/{editor.data.page.handle}</span>
            </Link>
          </div>
          <Button
            type="button"
            size={"lg"}
            onClick={() => void handlePrimaryAction()}
            disabled={editor.isSyncing}
            className={"px-6 h-10 rounded-md uppercase text-xs min-w-30"}
          >
            {editor.isSyncing && <Loader2 className="size-4 animate-spin" />}
            {editor.hasUnsyncedChanges ? (
              <span>Sync</span>
            ) : (
              <>
                {isCopied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
                <span>{isCopied ? "Copied" : "Share"}</span>
              </>
            )}
          </Button>
        </div>

        <div className="min-h-0 flex-1 max-w-[375px] mx-auto">
          <ProfilePageRenderer
            isPreview
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
