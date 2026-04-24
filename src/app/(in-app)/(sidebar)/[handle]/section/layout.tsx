import { auth } from "@/auth";
import { ProfilePageEditorProvider } from "@/components/section/profile-page/profile-page-editor-provider";
import { ProfilePagePreview } from "@/components/section/profile-page/profile-page-preview";
import { profilePageServerQueryOptions } from "@/lib/profile-page/server-query-options";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Suspense } from "react";

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
  params: Promise<{
    handle: string;
  }>;
};

export default async function SectionLayout({ children, params }: SectionLayoutProps) {
  const queryClient = new QueryClient();
  const session = await auth();
  const userId = session?.user.id as string;
  const { handle } = await params;
  const profilePageQuery = profilePageServerQueryOptions(userId);

  await queryClient.prefetchQuery(profilePageQuery);
  const initialProfilePageData = queryClient.getQueryData(profilePageQuery.queryKey) ?? null;

  if (!initialProfilePageData?.page.handle) {
    redirect("/onboarding");
  }

  if (initialProfilePageData.page.handle !== handle) {
    redirect(`/${initialProfilePageData.page.handle}/section`);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<SectionLayoutFallback />}>
        <ProfilePageEditorProvider initialData={initialProfilePageData}>
          <div className="flex h-full min-h-0 flex-row gap-4">
            <section className="min-h-0 flex-1 overflow-hidden">
              <div className="container relative z-0 mx-auto h-full max-w-md">{children}</div>
            </section>
            <section className="min-h-0 flex-1 overflow-hidden">
              <ProfilePagePreview />
            </section>
          </div>
        </ProfilePageEditorProvider>
      </Suspense>
    </HydrationBoundary>
  );
}
