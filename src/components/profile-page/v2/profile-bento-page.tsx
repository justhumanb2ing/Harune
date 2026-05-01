import Image from "next/image";
import Link from "next/link";
import { ProfilePageEditorProvider } from "@/components/profile-page/layout/profile-page-editor-provider";
import { ProfileBentoProfileMotion } from "@/components/profile-page/v2/profile-bento-entry-motion";
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
    <ProfileBentoProfileMotion className="flex w-[380px] max-w-full shrink-0 flex-col xl:sticky xl:top-[var(--v2-page-top-offset)] xl:min-w-[20rem] xl:w-[700px] xl:shrink">
      <div className="flex flex-col gap-8 overflow-hidden">
        <div className="flex px-4">
          <div className="relative flex size-32 items-center justify-center overflow-hidden rounded-full bg-secondary xl:size-44">
            {page.image ? (
              <Image
                alt={displayName}
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
          <h1 className="min-h-8 whitespace-pre-line break-all p-0 font-bold text-4xl! xl:text-5xl!">
            {displayName}
          </h1>

          {page.bio ? (
            <p className="min-h-8 whitespace-pre-line break-all p-0 text-xl!">{page.bio}</p>
          ) : (
            <p className="min-h-8 p-0 text-xl! text-muted-foreground">Bio</p>
          )}

          <div className="flex flex-col gap-2 text-neutral-500">
            <p className="h-fit p-0 text-base!">{page.role || "What do you do?"}</p>
            <p className="h-fit p-0 text-base!">{page.location || "Where are you based?"}</p>
          </div>
        </div>
      </div>
    </ProfileBentoProfileMotion>
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
    <footer className={cn("flex items-center justify-center gap-2", className)}>
      {isOwner ? (
        <>
          <ProfileBentoOwnerSettingPopover />
          <Button
            nativeButton={false}
            variant="ghost"
            className="px-2 font-normal"
            render={
              <Link href="#" className="text-neutral-500">
                Analytics
              </Link>
            }
          />
        </>
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
          render={
            <Link href="/sign-in" className="text-neutral-500">
              create my page
            </Link>
          }
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
        className="w-full py-16 md:fixed md:bottom-12 md:left-12 md:z-30 md:w-auto md:justify-start md:p-0"
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
