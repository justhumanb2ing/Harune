import Image from "next/image";
import { ProfilePageEditorProvider } from "@/components/profile-page/layout/profile-page-editor-provider";
import { ProfileBentoInteractiveGrid } from "@/components/profile-page/v2/profile-bento-interactive-grid";
import { ProfileBentoProfileEditor } from "@/components/profile-page/v2/profile-bento-profile-editor";
import { ProfileBentoReadonlyGrid } from "@/components/profile-page/v2/profile-bento-readonly-grid";
import type { ProfilePageData, PublicProfileBentoPageData } from "@/lib/profile-page/types";

type ProfileBentoPageProps = PublicProfileBentoPageData & {
  editorData: ProfilePageData | null;
  isOwner: boolean;
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

export function ProfileBentoPage({ page, bento, editorData, isOwner }: ProfileBentoPageProps) {
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
