import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AnalyticsPageClient } from "@/app/(public-profile)/[handle]/analytics/page-client";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { appConfig } from "@/lib/config";
import { getProfileAnalyticsPath, getProfileAppPath } from "@/lib/profile/app-paths";
import { getOwnedProfilePage, getOwnedProfilePageByHandle } from "@/lib/profile/queries";

type AnalyticsPageProps = {
  params: Promise<{
    handle: string;
  }>;
};

export async function generateMetadata({ params }: AnalyticsPageProps): Promise<Metadata> {
  const [{ handle }, session] = await Promise.all([params, auth()]);

  if (!session?.user?.id) {
    return {
      title: "Analytics",
      description: `View your ${appConfig.projectName} profile page analytics.`,
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
    title: `${displayName} analytics`,
    description: `View clicks, visits, and engagement for @${ownedProfilePage?.handle || handle}.`,
    robots: {
      follow: false,
      index: false,
    },
  };
}

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const { handle } = await params;
  const profilePage = await getOwnedProfilePageByHandle(session.user.id, handle);

  if (!profilePage?.handle) {
    const ownedProfilePage = await getOwnedProfilePage(session.user.id);

    if (ownedProfilePage?.handle) {
      redirect(getProfileAnalyticsPath(ownedProfilePage.handle));
    }

    redirect("/create");
  }

  return (
    <>
      <main className="flex h-full min-h-0 flex-col gap-12 overflow-y-auto p-4 pt-10 pb-24 sm:p-8 sm:pb-24 lg:pb-8">
        <AnalyticsPageClient />
      </main>
      <aside className="fixed inset-x-0 bottom-0 block bg-background p-2 lg:hidden">
        <Button
          nativeButton={false}
          type="button"
          variant="outline"
          size="lg"
          className="h-12 w-full text-lg font-bold! brand-button"
          render={<Link href={getProfileAppPath(profilePage.handle)}>My Page</Link>}
        />
      </aside>
    </>
  );
}
