import Image from "next/image";
import Link from "next/link";
import { PROFILE_BENTO_PROFILE_SHELL_CLASS } from "@/components/profile/v2/profile-bento-profile-shell";
import { ProfileBentoReadonlyGrid } from "@/components/profile/v2/profile-bento-readonly-grid";
import type { ProfilePageData, PublicProfileBentoPageData } from "@/lib/profile/types";
import { cn } from "@/lib/utils";

type ProfileBentoPageProps = PublicProfileBentoPageData & {
  editorData: ProfilePageData | null;
  isOwner: boolean;
  viewerProfilePage: { handle: string } | null;
};

const isDeploymentEnvironment = process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV);

export const PROFILE_BENTO_PAGE_SECTION_CLASS =
  "mx-auto flex min-h-lvh w-full flex-col items-center gap-8 px-6 pb-8 pt-[var(--v2-page-top-offset)] [--v2-page-top-offset:2rem] sm:px-8 xl:[--v2-page-top-offset:5rem] xl:flex-row xl:items-stretch xl:justify-center xl:gap-[clamp(3rem,calc((100vw-80rem)*0.25+3rem),6rem)] xl:px-10 2xl:gap-[clamp(7.5rem,calc((100vw-96rem)*0.6+7.5rem),18rem)]";

export function ProfileBentoProfileAside({ page }: Pick<PublicProfileBentoPageData, "page">) {
  const imageAlt = page.name ?? page.userName ?? page.handle;

  return (
    <aside className={cn(PROFILE_BENTO_PROFILE_SHELL_CLASS)}>
      <div className="flex flex-col gap-8 overflow-hidden">
        <div className="flex px-4">
          <div className="relative flex size-32 items-center justify-center overflow-hidden rounded-full bg-secondary xl:size-44">
            {page.image ? (
              <Image
                alt={imageAlt}
                className="size-full object-cover"
                height={176}
                priority
                src={page.image}
                width={176}
              />
            ) : (
              <span className="flex size-full flex-col items-center justify-center gap-2 rounded-full text-muted-foreground">
                <span className="font-semibold text-lg">Avatar</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 p-4 pt-0">
          {page.name ? (
            <h1 className="min-h-8 whitespace-pre-line break-all p-0 font-bold text-3xl! xl:text-5xl! tracking-tighter">
              {page.name}
            </h1>
          ) : null}

          {page.bio ? (
            <p className="min-h-8 whitespace-pre-line break-all p-0 text-lg! xl:text-xl!">
              {page.bio}
            </p>
          ) : null}

          {page.role || page.location ? (
            <div className="flex flex-col gap-2 text-neutral-500">
              {page.role ? <p className="h-fit p-0 text-base!">{page.role}</p> : null}
              {page.location ? <p className="h-fit p-0 text-base!">{page.location}</p> : null}
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}

function ProfileBentoFooterAction({
  className,
  viewerProfilePage,
}: {
  className?: string;
  viewerProfilePage: { handle: string } | null;
}) {
  const href = viewerProfilePage?.handle ? `/${viewerProfilePage.handle}` : "/sign-in";
  const label = viewerProfilePage?.handle ? "my page" : "create my page";

  return (
    <footer className={cn("flex items-center justify-center gap-2", className)}>
      <Link
        href={href}
        className="inline-flex min-h-9 items-center justify-center rounded-md px-3 font-normal text-neutral-500 text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        {label}
      </Link>
    </footer>
  );
}

export async function ProfileBentoPage({
  page,
  bento,
  editorData,
  isOwner,
  viewerProfilePage,
}: ProfileBentoPageProps) {
  if (isOwner && editorData) {
    const { ProfileBentoOwnerEditorSurface } = await import(
      "@/components/profile/v2/profile-bento-owner-editor-surface"
    );

    return (
      <ProfileBentoOwnerEditorSurface
        bento={bento}
        disableAnalytics={isDeploymentEnvironment}
        editorData={editorData}
        ownerHandle={page.handle}
      />
    );
  }

  return (
    <section className={PROFILE_BENTO_PAGE_SECTION_CLASS}>
      <ProfileBentoProfileAside page={page} />
      <ProfileBentoReadonlyGrid bento={bento} />
      <ProfileBentoFooterAction
        className="w-full py-16 md:fixed md:bottom-12 md:left-12 md:z-30 md:w-auto md:justify-start md:p-0"
        viewerProfilePage={viewerProfilePage}
      />
    </section>
  );
}
