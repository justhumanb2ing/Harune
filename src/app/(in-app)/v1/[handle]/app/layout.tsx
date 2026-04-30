import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { auth } from "@/auth";
import { ProfilePageEditorProvider } from "@/components/profile-page/layout/profile-page-editor-provider";
import { ProfilePagePreview } from "@/components/profile-page/preview/profile-page-preview";
import ProfilePreviewMobileDrawer from "@/components/profile-page/preview/profile-preview-mobile-drawer";
import { appConfig } from "@/lib/config";
import { getProfileAppPath } from "@/lib/profile-page/app-paths";
import { getOwnedProfilePage, getOwnedProfilePageByHandle } from "@/lib/profile-page/queries";
import { profilePageServerQueryOptions } from "@/lib/profile-page/server-query-options";

export const dynamic = "force-dynamic";

type SectionRouteProps = {
  params: Promise<{
    handle: string;
  }>;
};

export async function generateMetadata({ params }: SectionRouteProps): Promise<Metadata> {
  const [{ handle }, session] = await Promise.all([params, auth()]);

  if (!session?.user.id) {
    return {
      title: "Edit profile",
      description: `Manage your ${appConfig.projectName} profile page.`,
      robots: {
        follow: false,
        index: false,
      },
    };
  }

  const profilePage = await getOwnedProfilePageByHandle(session.user.id, handle);
  const ownedProfilePage = profilePage ?? (await getOwnedProfilePage(session.user.id));
  const displayName = ownedProfilePage?.name || ownedProfilePage?.handle || handle;

  return {
    title: `Edit ${displayName}`,
    description: `Manage links, socials, and profile details for @${ownedProfilePage?.handle || handle}.`,
    robots: {
      follow: false,
      index: false,
    },
  };
}

function SectionLayoutFallback() {
  return (
    <div className="flex h-full min-h-0 flex-row gap-4">
      <section className="min-h-0 flex-1 overflow-auto">
        <div className="container mx-auto max-w-md py-10" />
      </section>
      <section className="min-h-0 flex-1 overflow-auto" />
    </div>
  );
}

type SectionLayoutProps = {
  children: ReactNode;
} & SectionRouteProps;

export default async function SectionLayout({ children, params }: SectionLayoutProps) {
  const queryClient = new QueryClient();
  const session = await auth();
  const userId = session?.user.id as string;
  const { handle } = await params;
  const ownedProfilePage = await getOwnedProfilePage(userId);
  const profilePageQuery = profilePageServerQueryOptions(userId, handle);

  await queryClient.prefetchQuery(profilePageQuery);
  const initialProfilePageData = queryClient.getQueryData(profilePageQuery.queryKey) ?? null;

  if (!initialProfilePageData?.page.handle) {
    if (ownedProfilePage?.handle) {
      redirect(getProfileAppPath(ownedProfilePage.handle));
    }

    redirect("/create");
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<SectionLayoutFallback />}>
        <ProfilePageEditorProvider initialData={initialProfilePageData} handle={handle}>
          <div className="relative flex h-full min-h-0 flex-row gap-4">
            <section className="relative min-h-0 flex-1 overflow-hidden overflow-y-auto">
              <div className="relative z-0 mx-auto min-h-full w-full max-w-full pb-24 sm:max-w-sm lg:pb-8">
                {children}
              </div>
            </section>
            <section className="hidden lg:block min-h-0 flex-1 overflow-hidden">
              <ProfilePagePreview />
            </section>
            <aside className="fixed inset-x-0 bottom-0 block bg-background p-2 lg:hidden">
              <ProfilePreviewMobileDrawer />
            </aside>
          </div>
        </ProfilePageEditorProvider>
      </Suspense>
    </HydrationBoundary>
  );
}
