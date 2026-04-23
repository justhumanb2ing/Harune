"use client";

import { ProfilePageRenderer } from "@/components/section/profile-page/profile-page-renderer";
import { useProfilePageEditor } from "@/components/section/profile-page/use-profile-page-editor";
import { Button } from "@/components/ui/button";
import useUser from "@/lib/users/useUser";
import { ArrowUpRightIcon, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";

export function ProfilePagePreview() {
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
          <div className="">
            <Link
              href={`/${editor.data.page.handle}`}
              className="flex items-center gap-1 rounded-xl bg-foreground text-primary-foreground py-2 px-6 font-medium text-sm group"
            >
              <span>leeve.li/{editor.data.page.handle}</span>
              <ArrowUpRightIcon className="size-4 group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>
          <Button
            type="button"
            size={"lg"}
            onClick={() => void editor.handleSync()}
            disabled={!editor.hasUnsyncedChanges || editor.isSyncing}
            className={"px-6 rounded-md uppercase text-xs"}
          >
            {editor.isSyncing && <Loader2 className="size-4 animate-spin" />}
            {!editor.hasUnsyncedChanges ? <span>Up to date</span> : <span>Sync</span>}
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
            socialLinks={editor.data.socialLinks}
            textBoxItems={editor.data.textBoxItems}
            userName={user?.name ?? null}
          />
        </div>
      </div>
    </motion.div>
  );
}
