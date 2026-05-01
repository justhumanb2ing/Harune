import Image from "next/image";
import { ProfileBentoInteractiveGrid } from "@/components/profile-page/v2/profile-bento-interactive-grid";
import type { PublicProfileBentoPageData } from "@/lib/profile-page/types";

type ProfileBentoPageProps = PublicProfileBentoPageData;

export function ProfileBentoPage({ page, bento }: ProfileBentoPageProps) {
  const displayName = page.name ?? page.userName ?? page.handle;

  return (
    <section className="mx-auto flex min-h-lvh w-full max-w-7xl flex-col gap-8 px-4 py-8 lg:flex-row lg:items-start">
      <aside className="flex shrink-0 flex-col gap-5 lg:sticky lg:top-8 lg:w-80">
        {page.backgroundImage ? (
          <div className="relative h-44 w-full overflow-hidden rounded-lg">
            <Image
              alt=""
              className="object-cover"
              fill
              priority
              sizes="(min-width: 1024px) 1024px, 100vw"
              src={page.backgroundImage}
            />
          </div>
        ) : null}
        <div className="flex items-center gap-4 lg:flex-col lg:items-start">
          {page.image ? (
            <Image
              alt={displayName}
              className="size-20 rounded-full object-cover"
              height={80}
              priority={!page.backgroundImage}
              src={page.image}
              width={80}
            />
          ) : null}
          <div className="min-w-0">
            <h1 className="font-semibold text-3xl tracking-tight">{displayName}</h1>
            {page.role || page.location ? (
              <p className="mt-1 text-muted-foreground text-sm">
                {[page.role, page.location].filter(Boolean).join(" / ")}
              </p>
            ) : null}
          </div>
        </div>
        {page.bio ? (
          <p className="max-w-2xl whitespace-pre-line text-muted-foreground text-sm leading-6">
            {page.bio}
          </p>
        ) : null}
      </aside>

      <ProfileBentoInteractiveGrid initialBento={bento} />
    </section>
  );
}
