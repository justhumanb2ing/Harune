"use client";

import { MailIcon } from "lucide-react";
import Image from "next/image";
import { ProfileAvatarImage } from "@/components/profile/media/profile-avatar-image";
import { ConfettiButton } from "@/components/ui/confetti-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { appConfig } from "@/lib/config";
import { getProfileAppPath } from "@/lib/profile/app-paths";
import { buildProfileBentoSharePayload } from "./profile-bento-share-intents";

const shareAssetBaseUrl = "https://cdn.harune.me/public/assets/link-provider-icon";

const SHARE_SOCIAL_ITEMS = [
  { channel: "x", label: "X", src: `${shareAssetBaseUrl}/x.svg` },
  { channel: "threads", label: "Threads", src: `${shareAssetBaseUrl}/threads.svg` },
  { channel: "facebook", label: "Facebook", src: `${shareAssetBaseUrl}/facebook.svg` },
  { channel: "linkedin", label: "LinkedIn", src: `${shareAssetBaseUrl}/linkedin.svg` },
  { channel: "whatsapp", label: "WhatsApp", src: `${shareAssetBaseUrl}/whatsapp.svg` },
  { channel: "snapchat", label: "Snapchat", src: `${shareAssetBaseUrl}/snapchat.svg` },
  { channel: "email", label: "Email", src: null },
] as const;

type ProfileBentoShareActionDialogContentProps = {
  handle: string;
  isBusy: boolean;
  isCopied: boolean;
  image: string | null;
  imageCrop?: Parameters<typeof ProfileAvatarImage>[0]["imageCrop"];
  name: string;
  onOpenChange: (open: boolean) => void;
  onPrimaryAction: () => void;
  open: boolean;
};

export function ProfileBentoShareActionDialogContent({
  handle,
  isBusy,
  isCopied,
  image,
  imageCrop,
  name,
  onOpenChange,
  onPrimaryAction,
  open,
}: ProfileBentoShareActionDialogContentProps) {
  const sharePageUrl = `${appConfig.url}${getProfileAppPath(handle)}`;
  const shareContext = { handle, name };

  const openShareDestination = async (channel: (typeof SHARE_SOCIAL_ITEMS)[number]["channel"]) => {
    const payload = buildProfileBentoSharePayload(channel, shareContext);

    if (payload.href) {
      window.open(payload.href, "_blank", "noopener,noreferrer");
      return;
    }

    if (window.navigator.share) {
      await window.navigator.share({
        text: payload.text,
        title: shareContext.name.trim() || shareContext.handle,
        url: sharePageUrl,
      });
      return;
    }

    await window.navigator.clipboard.writeText(payload.text);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[calc(100%-2rem)] rounded-[3rem] p-6 shadow-float-lg drop-shadow-2xl sm:max-w-md"
      >
        <DialogHeader className="flex-row items-center gap-3 px-1">
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
          <div className="flex min-w-0 flex-col justify-center">
            <DialogTitle className="truncate font-bold text-lg tracking-tight">{name}</DialogTitle>
            <DialogDescription className="truncate text-neutral-700 text-sm">
              @{handle}
            </DialogDescription>
          </div>
        </DialogHeader>
        <main className="mt-0 grid gap-10">
          <div className="flex flex-col gap-4 p-2">
            <div className="rounded-xl text-base leading-relaxed">
              <p>Built a little space online. Take a look ↓</p>
              <p className="font-semibold">harune.me/{handle}</p>
            </div>
            <div className="overflow-hidden rounded-2xl bg-white px-6 py-6 shadow-float">
              <div className="flex flex-col items-center justify-center gap-2 text-center sm:gap-2">
                <div className="relative flex size-20 items-center justify-center overflow-hidden rounded-full bg-secondary sm:size-24">
                  {image ? (
                    <ProfileAvatarImage
                      alt={name || handle}
                      className="size-full"
                      imageCrop={imageCrop}
                      loading="eager"
                      src={image}
                    />
                  ) : (
                    <div aria-hidden className="size-full rounded-full bg-secondary/70" />
                  )}
                </div>

                <div className="flex min-w-0 flex-col items-center gap-0">
                  <p className="max-w-full truncate font-black text-xl tracking-tight sm:text-[1.75rem]">
                    {name || handle}
                  </p>
                  <p className="truncate font-semibold text-xs sm:text-sm">harune.me/{handle}</p>
                </div>
              </div>
            </div>
          </div>

          <section className="min-w-0 space-y-4 p-2 font-semibold text-base">
            <p>Choose a channel to share</p>
            <aside
              aria-label="Share channels"
              className="scrollbar-hidden max-w-full min-w-0 overflow-x-auto overflow-y-hidden pb-1"
            >
              <div className="flex w-max min-w-full gap-5 pr-1">
                {SHARE_SOCIAL_ITEMS.map((item) => (
                  <button
                    aria-label={`Share to ${item.label}`}
                    className="flex shrink-0 flex-col items-center gap-2 rounded-2xl text-center font-medium text-neutral-700 text-xs"
                    key={item.label}
                    type="button"
                    onClick={() => {
                      onOpenChange(false);
                      void openShareDestination(item.channel);
                    }}
                  >
                    <span className="flex size-12 items-center justify-center overflow-hidden rounded-full bg-secondary text-foreground">
                      {item.src ? (
                        <Image
                          alt=""
                          aria-hidden
                          className="size-full object-contain"
                          height={20}
                          src={item.src}
                          unoptimized
                          width={20}
                        />
                      ) : (
                        <MailIcon aria-hidden className="size-5" />
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </aside>
          </section>
        </main>
        <DialogFooter className="gap-2">
          <ConfettiButton
            aria-busy={isBusy}
            disabled={isBusy}
            type="button"
            onClick={onPrimaryAction}
            className="h-14 w-full rounded-full px-4 font-semibold text-lg shadow-none"
          >
            <span>{isCopied ? "Copied" : "Copy page"}</span>
          </ConfettiButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
