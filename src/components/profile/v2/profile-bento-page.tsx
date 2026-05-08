import Image from "next/image";
import Link from "next/link";
import { PROFILE_BENTO_PROFILE_SHELL_CLASS } from "@/components/profile/v2/profile-bento-profile-shell";
import { ProfileBentoReadonlyGrid } from "@/components/profile/v2/profile-bento-readonly-grid";
import type {
  GetProfileByHandle200BentoItem,
  GetProfileByHandle200Page,
} from "@/lib/api/generated/http/schemas/profile-api";
import type { ProfileBentoItem, ProfilePageData } from "@/lib/profile/types";
import { cn } from "@/lib/utils";

type ProfileBentoPageProps = {
  page: GetProfileByHandle200Page & {
    userName: string | null;
  };
  bento: GetProfileByHandle200BentoItem[];
  analyticsViews: number;
  editorData: ProfilePageData | null;
  isOwner: boolean;
  viewerProfilePage: {
    handle: string;
    image: string | null;
    name: string | null;
  } | null;
};

const isDeploymentEnvironment = process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV);

export const PROFILE_BENTO_PAGE_SECTION_CLASS =
  "mx-auto flex min-h-lvh w-full flex-col items-center gap-8 px-6 pb-8 pt-[var(--v2-page-top-offset)] [--v2-page-top-offset:2rem] sm:px-8 xl:[--v2-page-top-offset:5rem] xl:flex-row xl:items-stretch xl:justify-center xl:gap-[clamp(3rem,calc((100vw-80rem)*0.25+3rem),6rem)] xl:px-10 2xl:gap-[clamp(7.5rem,calc((100vw-96rem)*0.6+7.5rem),18rem)]";

export function ProfileBentoProfileAside({ page }: Pick<ProfileBentoPageProps, "page">) {
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
            <p className="min-h-8 whitespace-pre-line break-all p-0 text-lg! text-neutral-600 xl:text-xl!">
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
  viewerProfilePage: {
    handle: string;
    image: string | null;
    name: string | null;
  } | null;
}) {
  const href = viewerProfilePage?.handle ? `/${viewerProfilePage.handle}` : "/sign-in";
  const label = viewerProfilePage?.handle ? "my page" : "create my page";
  const imageAlt = viewerProfilePage?.name ?? viewerProfilePage?.handle ?? "My page";

  return (
    <footer className={cn("flex items-center justify-center gap-2", className)}>
      <Link
        href={href}
        className="inline-flex items-center gap-2 rounded-md p-2 py-1.5 font-normal text-sm text-muted-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        {viewerProfilePage ? (
          <span className="relative size-5 shrink-0 overflow-hidden rounded-full bg-secondary">
            {viewerProfilePage.image ? (
              <Image
                alt={imageAlt}
                className="size-full object-cover"
                height={24}
                src={viewerProfilePage.image}
                width={24}
              />
            ) : (
              <span aria-hidden className="block size-full" />
            )}
          </span>
        ) : null}
        <span>{label}</span>
      </Link>
    </footer>
  );
}

export async function ProfileBentoPage({
  analyticsViews,
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
        bento={bento as ProfileBentoItem[]}
        analyticsViews={analyticsViews}
        disableAnalytics={isDeploymentEnvironment}
        editorData={editorData}
        ownerHandle={page.handle}
      />
    );
  }

  return (
    <section className={PROFILE_BENTO_PAGE_SECTION_CLASS}>
      <ProfileBentoProfileAside page={page} />
      <ProfileBentoReadonlyGrid bento={bento as ProfileBentoItem[]} />
      <ProfileBentoFooterAction
        className="w-full py-16 md:fixed md:bottom-12 md:left-12 md:z-30 md:w-auto md:justify-start md:p-0"
        viewerProfilePage={viewerProfilePage}
      />
    </section>
  );
}
