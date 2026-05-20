import { CompassIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { ProfileAvatarImage } from "@/components/profile/v2/profile-avatar-image";
import { ProfileBentoPublicShareButton } from "@/components/profile/v2/profile-bento-public-share-button";
import { ProfileBentoReadonlyGrid } from "@/components/profile/v2/profile-bento-readonly-grid";
import { ProfileBentoSurfaceMotion } from "@/components/profile/v2/profile-bento-readonly-profile-motion";
import { ProfilePageAnalyticsTracker } from "@/components/site-instrumentation/profile-analytics-tracker";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { getProfileByHandle } from "@/lib/api/generated/http/profile-api/profile-api";
import type { GetMe200, GetMe200ProfilePage } from "@/lib/api/generated/http/schemas/me-api";
import type {
  GetProfileByHandle200BentoItem,
  GetProfileByHandle200Page,
} from "@/lib/api/generated/http/schemas/profile-api";
import type { ProfileBentoItem, ProfilePageData } from "@/lib/profile/types";
import { cn } from "@/lib/utils";
import { normalizeProfileBentoItems } from "./profile-bento-grid-model";

type ProfileBentoPageProps = {
  page: GetProfileByHandle200Page & {
    userName: string | null;
  };
  bento: GetProfileByHandle200BentoItem[];
  editorData: ProfilePageData | null;
  isOwner: boolean;
  initialProfileResponse: Awaited<ReturnType<typeof getProfileByHandle>> | null;
  initialUser: GetMe200 | null;
  viewerProfilePage: {
    handle: string;
    image: string | null;
    imageCrop: NonNullable<GetMe200ProfilePage>["imageCrop"];
    name: string | null;
  } | null;
};

const isDeploymentEnvironment = process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV);

export const PROFILE_BENTO_PAGE_SECTION_CLASS =
  "mx-auto flex min-h-lvh w-full flex-col items-center gap-8 px-6 pb-8 pt-[var(--v2-page-top-offset)] [--v2-page-top-offset:2rem] sm:px-8 2xl:[--v2-page-top-offset:5rem] 2xl:flex-row 2xl:items-stretch 2xl:justify-evenly 2xl:gap-[clamp(7.5rem,calc((100vw-96rem)*0.6+7.5rem),18rem)] 2xl:px-10";

export const PROFILE_BENTO_PUBLIC_PROFILE_SHELL_CLASS =
  "flex w-[360px] max-w-full shrink-0 flex-col sm:w-[400px] 2xl:sticky 2xl:top-[var(--v2-page-top-offset)] 2xl:self-start 2xl:min-w-[20rem] 2xl:w-[500px] 2xl:shrink-0";

export function ProfileBentoProfileAside({
  actionSlot,
  page,
}: Pick<ProfileBentoPageProps, "page"> & {
  actionSlot?: ReactNode;
}) {
  const imageAlt = page.name ?? page.userName ?? page.handle;

  return (
    <aside className={cn(PROFILE_BENTO_PUBLIC_PROFILE_SHELL_CLASS)}>
      <ProfileBentoSurfaceMotion delay={0} duration={0.68} initialScale={1} initialY={28}>
        <div className="flex flex-col gap-8 overflow-hidden">
          <div className="flex w-full items-center justify-between gap-4 px-0 2xl:px-0">
            <div className="relative flex size-32 items-center justify-center overflow-hidden rounded-full bg-secondary 2xl:size-44">
              {page.image ? (
                <ProfileAvatarImage
                  alt={imageAlt}
                  className="size-full"
                  fetchPriority="high"
                  imageCrop={page.imageCrop}
                  loading="eager"
                  src={page.image}
                />
              ) : (
                <span className="flex size-full flex-col items-center justify-center gap-2 rounded-full text-muted-foreground"></span>
              )}
            </div>
            {actionSlot ? <div className="shrink-0">{actionSlot}</div> : null}
          </div>

          <div className="flex flex-col gap-4 px-4 pt-0 2xl:px-0">
            {page.name ? (
              <h1 className="min-h-8 whitespace-pre-line break-all p-0 font-bold text-3xl! tracking-tighter 2xl:text-5xl!">
                {page.name}
              </h1>
            ) : null}

            {page.bio ? (
              <p className="min-h-16 whitespace-pre-line break-all p-0 text-lg! text-neutral-800 2xl:text-xl!">
                {page.bio}
              </p>
            ) : null}

            {page.role || page.location ? (
              <div className="flex flex-col gap-1 text-base text-neutral-500">
                {page.role ? <p className="h-fit p-0">{page.role}</p> : null}
                {page.location ? <p className="h-fit p-0">{page.location}</p> : null}
              </div>
            ) : null}
          </div>
        </div>
      </ProfileBentoSurfaceMotion>
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
    imageCrop: NonNullable<GetMe200ProfilePage>["imageCrop"];
    name: string | null;
  } | null;
}) {
  const href = viewerProfilePage?.handle ? `/${viewerProfilePage.handle}` : "/sign-in";
  const label = viewerProfilePage?.handle ? "my page" : "Create your page";
  const imageAlt = viewerProfilePage?.name ?? viewerProfilePage?.handle ?? "My page";
  const footerActionClassName = cn(
    "h-auto flex items-center rounded-sm border-0 px-4 py-2 text-sm",
    viewerProfilePage ? "" : "brand-button shadow-float"
  );

  return (
    <footer className={cn("flex items-center justify-center gap-2", className)}>
      <Button
        nativeButton={false}
        variant={"ghost"}
        className={footerActionClassName}
        render={
          <Link
            href={href}
            className="inline-flex items-center gap-2 rounded-sm px-4 py-2 text-sm font-medium"
          >
            {viewerProfilePage ? (
              <span className="relative size-5 shrink-0 overflow-hidden rounded-full">
                {viewerProfilePage.image ? (
                  <ProfileAvatarImage
                    alt={imageAlt}
                    className="size-full"
                    fetchPriority="high"
                    imageCrop={viewerProfilePage.imageCrop}
                    loading="eager"
                    src={viewerProfilePage.image}
                  />
                ) : (
                  <span aria-hidden className="block size-full" />
                )}
              </span>
            ) : null}
            <span>{label}</span>
          </Link>
        }
      />
      <Separator
        orientation="vertical"
        className={"rounded-lg data-vertical:w-[2.5px] data-vertical:my-2"}
      />
      <Button
        nativeButton={false}
        variant={"ghost"}
        size={"icon-lg"}
        className={"size-8"}
        render={
          <Link
            href="/explore"
            prefetch={false}
            className="inline-flex items-center rounded-md font-normal"
          >
            <span className="text-sm text-muted-foreground!">
              <CompassIcon />
            </span>
          </Link>
        }
      />
    </footer>
  );
}

export async function ProfileBentoPage({
  page,
  bento,
  editorData,
  isOwner,
  initialProfileResponse,
  initialUser,
  viewerProfilePage,
}: ProfileBentoPageProps) {
  const displayName = page.name || page.userName || page.handle;
  const normalizedBento = normalizeProfileBentoItems(bento as ProfileBentoItem[]);

  if (isOwner && editorData) {
    const { ProfileBentoOwnerEditorSurface } = await import(
      "@/components/profile/v2/profile-bento-owner-editor-surface"
    );

    return (
      <>
        <ProfilePageAnalyticsTracker
          displayName={displayName}
          handle={page.handle}
          profilePageId={page.id}
        />
        <ProfileBentoOwnerEditorSurface
          bento={normalizedBento}
          disableAnalytics={isDeploymentEnvironment}
          editorData={editorData}
          initialProfileResponse={initialProfileResponse}
          initialUser={initialUser}
          ownerHandle={page.handle}
        />
      </>
    );
  }

  return (
    <>
      <ProfilePageAnalyticsTracker
        displayName={displayName}
        handle={page.handle}
        profilePageId={page.id}
      />
      <section className={PROFILE_BENTO_PAGE_SECTION_CLASS}>
        <ProfileBentoProfileAside
          actionSlot={<ProfileBentoPublicShareButton className="2xl:hidden" handle={page.handle} />}
          page={page}
        />
        <ProfileBentoReadonlyGrid bento={normalizedBento} surface="public-page" />
        <ProfileBentoFooterAction
          className="w-full py-16 2xl:fixed 2xl:bottom-12 2xl:left-12 2xl:z-30 2xl:w-auto 2xl:justify-start 2xl:p-0"
          viewerProfilePage={viewerProfilePage}
        />
      </section>
    </>
  );
}
