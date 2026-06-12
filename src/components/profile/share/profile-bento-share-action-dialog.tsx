"use client";

import { SpinnerGapIcon } from "@phosphor-icons/react";
import dynamic from "next/dynamic";
import { useState } from "react";
import type { ProfileAvatarImage } from "@/components/profile/media/profile-avatar-image";
import { Button } from "@/components/ui/button";

const LazyProfileBentoShareActionDialogContent = dynamic(
  () =>
    import("@/components/profile/share/profile-bento-share-action-dialog-content").then(
      (module) => module.ProfileBentoShareActionDialogContent
    ),
  { ssr: false }
);

type ProfileBentoShareActionDialogProps = {
  handle: string;
  isBusy: boolean;
  isCopied: boolean;
  isSaving: boolean;
  triggerLabel: string;
  name: string;
  image: string | null;
  imageCrop?: Parameters<typeof ProfileAvatarImage>[0]["imageCrop"];
  onPrimaryAction: () => void;
};

export function ProfileBentoShareActionDialog({
  handle,
  isBusy,
  isCopied,
  isSaving,
  triggerLabel,
  name,
  image,
  imageCrop,
  onPrimaryAction,
}: ProfileBentoShareActionDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        aria-busy={isBusy}
        className="brand-success-button w-36 border-0 px-0 py-5 font-semibold text-base shadow-none"
        disabled={isBusy}
        onClick={() => setOpen(true)}
        size="lg"
        type="button"
      >
        {isSaving ? <SpinnerGapIcon className="size-4 animate-spin" /> : null}
        <span>{triggerLabel}</span>
      </Button>
      {open ? (
        <LazyProfileBentoShareActionDialogContent
          handle={handle}
          image={image}
          imageCrop={imageCrop}
          isBusy={isBusy}
          isCopied={isCopied}
          name={name}
          onOpenChange={setOpen}
          onPrimaryAction={onPrimaryAction}
          open={open}
        />
      ) : null}
    </>
  );
}
