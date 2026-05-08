import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ProfileBentoPage } from "@/components/profile/v2/profile-bento-page";
import { WebPageJsonLd } from "@/components/site-instrumentation/structured-data";
import { getProfileByHandle } from "@/lib/api/generated/http/profile-api/profile-api";
import { appConfig } from "@/lib/config";
import { getProfilePageEditorData } from "@/lib/profile/queries";
import type { ProfilePageData, PublicProfileBentoPageData } from "@/lib/profile/types";
import { ApiError } from "@/lib/react-query/fetcher";
import { absoluteUrl, createPageMetadata } from "@/lib/seo";
import { getServerMe } from "@/lib/users/server-me";
import { getServerMeAnalytics } from "@/lib/users/server-me-analytics";

type HandlePageProps = {
  params: Promise<{
    handle: string;
  }>;
};

export const revalidate = 300;

const toSerializableProfilePageData = (
  data: Awaited<ReturnType<typeof getProfilePageEditorData>>
) =>
  data
    ? ({
        page: {
          id: data.page.id,
          handle: data.page.handle,
          linkBlockPosition: data.page.linkBlockPosition,
          location: data.page.location,
          name: data.page.name,
          role: data.page.role,
          bio: data.page.bio,
          image: data.page.image,
          backgroundImage: data.page.backgroundImage,
        },
      } satisfies ProfilePageData)
    : null;

type PublicProfilePageData = {
  page: PublicProfileBentoPageData["page"];
  bento: PublicProfileBentoPageData["bento"];
  viewer: {
    isAuthenticated: boolean;
    userId: string | null;
    canEdit: boolean;
  };
};

const toPublicProfilePageData = (data: Awaited<ReturnType<typeof getProfileByHandle>>) => {
  if (data.status !== 200) {
    return null;
  }

  return {
    page: {
      ...data.data.page,
      updatedAt: new Date(data.data.page.updatedAt),
      userName: null,
    },
    bento: data.data.bento,
    viewer: data.data.viewer,
  } satisfies PublicProfilePageData;
};

const getPublicProfilePage = async (handle: string) => {
  const requestCookies = await cookies();
  const cookieHeader = requestCookies.toString();

  try {
    return toPublicProfilePageData(
      await getProfileByHandle(handle, {
        headers: cookieHeader ? { cookie: cookieHeader } : undefined,
      })
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }

    throw error;
  }
};

export async function generateMetadata({ params }: HandlePageProps): Promise<Metadata> {
  const { handle } = await params;
  const data = await getPublicProfilePage(handle);

  if (!data?.page.handle) {
    return {};
  }

  const title = `${data.page.name || data.page.userName || data.page.handle}`;

  return createPageMetadata({
    path: `/${data.page.handle}`,
    title,
    description: data.page.bio || `Visit @${data.page.handle}'s page.`,
    imageAlt: title,
    imagePath: `/${data.page.handle}/opengraph-image`,
    twitterImagePath: `/${data.page.handle}/twitter-image`,
  });
}

export default async function HandlePage({ params }: HandlePageProps) {
  const { handle } = await params;
  const [data, me] = await Promise.all([getPublicProfilePage(handle), getServerMe()]);

  if (!data?.page.handle) {
    notFound();
  }

  const isOwner = data.viewer.canEdit;
  const editorData =
    isOwner && me?.user?.id
      ? await getProfilePageEditorData(me.user.id, data.page.handle).then(
          toSerializableProfilePageData
        )
      : null;
  const analytics = isOwner ? await getServerMeAnalytics() : null;
  const analyticsViews =
    analytics && analytics.status === 200 && analytics.data.state === "ready"
      ? analytics.data.summaries.today.pageViews
      : 0;
  const title = `${data.page.name || data.page.userName || data.page.handle} on ${appConfig.projectName}`;

  return (
    <>
      <WebPageJsonLd
        id={absoluteUrl(`/${data.page.handle}`)}
        description={data.page.bio || `Visit @${data.page.handle}'s page.`}
        title={title}
        lastUpdated={data.page.updatedAt.toISOString()}
        isAccessibleForFree
        publisher={{
          "@type": "Organization",
          name: appConfig.projectName,
          url: appConfig.url,
        }}
        about={{
          "@type": "Thing",
          name: data.page.handle,
        }}
      />
      <main className="min-h-lvh bg-background">
        <ProfileBentoPage
          page={data.page}
          bento={data.bento}
          editorData={editorData}
          isOwner={isOwner}
          analyticsViews={analyticsViews}
          viewerProfilePage={me?.profilePage ?? null}
        />
      </main>
    </>
  );
}
