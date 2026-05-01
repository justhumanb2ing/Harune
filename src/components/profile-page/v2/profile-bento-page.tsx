import Image from "next/image";
import Link from "next/link";
import { ProfilePageEditorProvider } from "@/components/profile-page/layout/profile-page-editor-provider";
import { ProfileBentoInteractiveGrid } from "@/components/profile-page/v2/profile-bento-interactive-grid";
import { ProfileBentoOwnerSettingPopover } from "@/components/profile-page/v2/profile-bento-owner-setting-popover";
import { ProfileBentoProfileEditor } from "@/components/profile-page/v2/profile-bento-profile-editor";
import { ProfileBentoReadonlyGrid } from "@/components/profile-page/v2/profile-bento-readonly-grid";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { ProfilePageData, PublicProfileBentoPageData } from "@/lib/profile-page/types";
import { cn } from "@/lib/utils";

type ProfileBentoPageProps = PublicProfileBentoPageData & {
  editorData: ProfilePageData | null;
  isOwner: boolean;
  viewerProfilePage: ProfileBentoViewerProfilePage | null;
};

type ProfileBentoViewerProfilePage = {
  handle: string;
  image: string | null;
  name: string | null;
};

function ProfileBentoProfileAside({ page }: Pick<PublicProfileBentoPageData, "page">) {
  const displayName = page.name ?? page.userName ?? page.handle;

  return (
    <aside className="flex w-[380px] max-w-full shrink-0 flex-col items-center gap-5 text-center xl:sticky xl:top-[var(--v2-page-top-offset)] xl:min-w-[20rem] xl:w-[700px] xl:shrink xl:items-start xl:text-left">
      <div className="flex items-center justify-center gap-4 xl:flex-col xl:items-start xl:justify-start">
        {page.image ? (
          <Image
            alt={displayName}
            className="size-32 rounded-full object-cover xl:size-44"
            height={176}
            priority
            src={page.image}
            width={176}
          />
        ) : null}
        <div className="min-w-0">
          <h1 className="whitespace-pre-line font-semibold text-3xl tracking-tight">
            {displayName}
          </h1>
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
  );
}

function ProfileBentoFooterAction({
  className,
  isOwner,
  viewerProfilePage,
}: {
  className?: string;
  isOwner: boolean;
  viewerProfilePage: ProfileBentoViewerProfilePage | null;
}) {
  return (
    <footer className={cn("flex justify-center", className)}>
      {isOwner ? (
        <ProfileBentoOwnerSettingPopover />
      ) : viewerProfilePage ? (
        <Button
          nativeButton={false}
          variant="ghost"
          className="px-1 font-normal"
          render={
            <Link className="flex-row items-center gap-1" href={`/v2/${viewerProfilePage.handle}`}>
              <Avatar size="sm">
                <AvatarImage
                  src={viewerProfilePage.image ?? undefined}
                  alt={viewerProfilePage.name ?? "My page"}
                />
                <AvatarFallback />
              </Avatar>
              <span>My page</span>
            </Link>
          }
        />
      ) : (
        <Button
          nativeButton={false}
          variant="ghost"
          render={<Link href="/sign-in">create my page</Link>}
        />
      )}
    </footer>
  );
}

export function ProfileBentoPage({
  page,
  bento,
  editorData,
  isOwner,
  viewerProfilePage,
}: ProfileBentoPageProps) {
  const content = (
    <section className="mx-auto flex min-h-lvh w-full flex-col items-center gap-8 px-4 pb-8 pt-[var(--v2-page-top-offset)] [--v2-page-top-offset:2rem] xl:[--v2-page-top-offset:5rem] xl:flex-row xl:items-stretch xl:justify-center xl:gap-[clamp(2rem,calc((100vw-80rem)*0.5+2rem),15rem)]">
      {isOwner && editorData ? (
        <ProfileBentoProfileEditor />
      ) : (
        <ProfileBentoProfileAside page={page} />
      )}

      {isOwner ? (
        <ProfileBentoInteractiveGrid initialBento={bento} />
      ) : (
        <ProfileBentoReadonlyGrid bento={bento} />
      )}
      <ProfileBentoFooterAction
        className="w-full pb-4 xl:fixed xl:bottom-12 xl:left-12 xl:z-30 xl:w-auto xl:justify-start xl:p-0"
        isOwner={isOwner}
        viewerProfilePage={viewerProfilePage}
      />
    </section>
  );

  if (!isOwner || !editorData) {
    return content;
  }

  return (
    <ProfilePageEditorProvider initialData={editorData} handle={page.handle}>
      {content}
    </ProfilePageEditorProvider>
  );
}
