import Image from "next/image";
import { ProfileBentoInteractiveGrid } from "@/components/profile-page/v2/profile-bento-interactive-grid";
import { ProfileBentoReadonlyGrid } from "@/components/profile-page/v2/profile-bento-readonly-grid";
import type { PublicProfileBentoPageData } from "@/lib/profile-page/types";

type ProfileBentoPageProps = PublicProfileBentoPageData & {
  isOwner: boolean;
};

export function ProfileBentoPage({ page, bento, isOwner }: ProfileBentoPageProps) {
  const displayName = page.name ?? page.userName ?? page.handle;

  return (
    <section className="mx-auto flex min-h-lvh w-full flex-col items-center gap-8 px-4 pb-8 pt-[var(--v2-page-top-offset)] [--v2-page-top-offset:2rem] xl:[--v2-page-top-offset:5rem] xl:flex-row xl:items-stretch xl:justify-center xl:gap-[clamp(2rem,calc((100vw-80rem)*0.5+2rem),15rem)]">
      <aside className="flex w-[380px] max-w-full shrink-0 flex-col items-center gap-5 text-center xl:sticky xl:top-[var(--v2-page-top-offset)] xl:min-w-[20rem] xl:w-[700px] xl:shrink xl:items-start xl:text-left">
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
        <div className="flex items-center justify-center gap-4 xl:flex-col xl:items-start xl:justify-start">
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

      {isOwner ? (
        <ProfileBentoInteractiveGrid initialBento={bento} />
      ) : (
        <ProfileBentoReadonlyGrid bento={bento} />
      )}
    </section>
  );
}
