import Image from "next/image";
import { InfiniteSlider } from "@/components/ui/infinite-slider";

const providerIconBaseUrl = "https://cdn.harune.me/public/assets/link-provider-icon";

const providerIcons = [
  "behance",
  "buymeacoffee",
  "chzzk",
  "discord",
  "dribbble",
  "facebook",
  "figma",
  "github",
  "gumroad",
  "instagram",
  "kofi",
  "linkedin",
  "medium",
  "patreon",
  "producthunt",
  "reddit",
  "snapchat",
  "spotify",
  "substack",
  "threads",
  "tiktok",
  "twitch",
  "whatsapp",
  "x",
] as const;

export default function LinkProviderSection() {
  return (
    <section className="flex h-[60vh] flex-col items-center justify-center overflow-hidden px-4 py-16">
      <div className="flex flex-col items-center gap-20">
        <p className="text-2xl font-medium tracking-normal text-foreground md:text-3xl">
          Expanding provider support
        </p>
        <div className="relative isolate w-full max-w-3xl">
          <InfiniteSlider speedOnHover={20} gap={16}>
            {providerIcons.map((provider) => (
              <div key={provider} className="size-14 shrink-0 overflow-hidden rounded-lg">
                <Image
                  src={`${providerIconBaseUrl}/${provider}.svg`}
                  alt={`${provider} icon`}
                  width={120}
                  height={120}
                  className="size-full rounded-[4px]"
                />
              </div>
            ))}
          </InfiniteSlider>
          <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-24 bg-gradient-to-r from-white via-white/95 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-24 bg-gradient-to-l from-white via-white/95 to-transparent" />
        </div>
      </div>
    </section>
  );
}
