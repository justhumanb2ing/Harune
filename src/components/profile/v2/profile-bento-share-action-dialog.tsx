"use client";

import { SpinnerGapIcon } from "@phosphor-icons/react";
import { CheckIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { ProfileAvatarImage } from "@/components/profile/v2/profile-avatar-image";
import { Button } from "@/components/ui/button";
import { ConfettiButton } from "@/components/ui/confetti-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const shareAssetBaseUrl = "https://cdn.harune.me/public/assets/link-provider-icon";

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

const SHARE_SOCIAL_ITEMS = [
  { label: "X", src: `${shareAssetBaseUrl}/x.svg` },
  { label: "Threads", src: `${shareAssetBaseUrl}/threads.svg` },
  { label: "Facebook", src: `${shareAssetBaseUrl}/facebook.svg` },
  { label: "LinkedIn", src: `${shareAssetBaseUrl}/linkedin.svg` },
  { label: "WhatsApp", src: `${shareAssetBaseUrl}/whatsapp.svg` },
  { label: "Snapchat", src: `${shareAssetBaseUrl}/snapchat.svg` },
] as const;

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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            aria-busy={isBusy}
            className="brand-button w-36 border-0 px-0 py-5 text-base font-semibold shadow-none"
            disabled={isBusy}
            size="lg"
            type="button"
          >
            {isSaving ? <SpinnerGapIcon className="size-4 animate-spin" /> : null}
            <span>{triggerLabel}</span>
          </Button>
        }
      />
      <DialogContent
        showCloseButton={false}
        className="max-w-[calc(100%-2rem)] rounded-[3rem] p-6 drop-shadow-2xl shadow-float-lg sm:max-w-md"
      >
        <DialogHeader className="flex-row items-center gap-3">
          <div className="relative size-14 shrink-0 overflow-hidden rounded-full bg-secondary">
            {image ? (
              <ProfileAvatarImage
                alt={name || handle}
                className="size-full"
                imageCrop={imageCrop}
                loading="eager"
                src={image}
              />
            ) : null}
          </div>
          <div className="flex min-w-0 flex-col gap-0.5">
            <DialogTitle className="truncate text-left text-xl font-bold tracking-tight">
              {name}
            </DialogTitle>
            <DialogDescription className="truncate text-left text-sm text-neutral-700">
              @{handle}
            </DialogDescription>
          </div>
        </DialogHeader>
        <main className="mt-0 grid gap-4">
          <section className="rounded-2xl bg-secondary/40 p-4 text-sm text-neutral-700">
            Choose a channel to connect and share.
          </section>
          <aside aria-label="Share channels" className="scrollbar-hidden overflow-x-auto pb-1">
            <div className="flex min-w-max gap-3 pr-1 py-6">
              {SHARE_SOCIAL_ITEMS.map((item) => {
                return (
                  <button
                    aria-label={item.label}
                    className="flex aspect-square w-16 shrink-0 flex-col items-center gap-2 rounded-2xl text-center text-xs font-medium text-neutral-700"
                    key={item.label}
                    type="button"
                  >
                    <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-foreground overflow-hidden">
                      <Image
                        alt=""
                        aria-hidden
                        className="size-full object-contain"
                        height={20}
                        src={item.src}
                        unoptimized
                        width={20}
                      />
                    </span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </aside>
        </main>
        <DialogFooter className="gap-2">
          <ConfettiButton
            aria-busy={isBusy}
            disabled={isBusy}
            type="button"
            onClick={() => {
              onPrimaryAction();
            }}
            className="w-full h-12 px-4 text-base font-semibold shadow-none"
          >
            {!isSaving && isCopied ? <CheckIcon className="size-4" /> : null}
            <span>{isCopied ? "Copied" : "Copy page"}</span>
          </ConfettiButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
