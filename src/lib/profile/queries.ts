import { and, desc, eq, inArray } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db } from "@/db";
import {
  profileBentoLayouts,
  profileBentos,
  profileLinkBentos,
  profileMapBentos,
  profileMediaBentos,
  profilePages,
  profilePlaylistBentos,
  profileSectionBentos,
  profileTextBentos,
} from "@/db/schema/profile";
import { users } from "@/db/schema/user";
import type { PlaylistProvider } from "@/lib/profile/playlist";
import type {
  ProfileBentoApiItem,
  ProfileBentoBreakpoint,
  ProfileBentoItem,
  ProfileBentoLayout,
  ProfilePageEditorApiData,
} from "@/lib/profile/types";

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type DbExecutor = typeof db | DbTransaction;

const toPlaylistProvider = (provider: string): PlaylistProvider => provider as PlaylistProvider;
export const PUBLIC_PROFILE_BENTO_CACHE_TAG = "public-profile-bento-page";

export const getOwnedProfilePage = async (userId: string) => {
  return db
    .select({
      id: profilePages.id,
      userId: profilePages.userId,
      handle: profilePages.handle,
      linkBlockPosition: profilePages.linkBlockPosition,
      location: profilePages.location,
      name: profilePages.name,
      role: profilePages.role,
      bio: profilePages.bio,
      image: profilePages.image,
      backgroundImage: profilePages.backgroundImage,
      createdAt: profilePages.createdAt,
      updatedAt: profilePages.updatedAt,
    })
    .from(profilePages)
    .where(eq(profilePages.userId, userId))
    .orderBy(desc(profilePages.createdAt))
    .limit(1)
    .then((rows) => rows[0] ?? null);
};

export const getOwnedProfilePageByHandle = async (userId: string, handle: string) => {
  return db
    .select({
      id: profilePages.id,
      userId: profilePages.userId,
      handle: profilePages.handle,
      linkBlockPosition: profilePages.linkBlockPosition,
      location: profilePages.location,
      name: profilePages.name,
      role: profilePages.role,
      bio: profilePages.bio,
      image: profilePages.image,
      backgroundImage: profilePages.backgroundImage,
      createdAt: profilePages.createdAt,
      updatedAt: profilePages.updatedAt,
    })
    .from(profilePages)
    .where(and(eq(profilePages.userId, userId), eq(profilePages.handle, handle)))
    .limit(1)
    .then((rows) => rows[0] ?? null);
};

export const getProfilePageEditorData = async (userId: string, handle?: string) => {
  const page = handle
    ? await getOwnedProfilePageByHandle(userId, handle)
    : await getOwnedProfilePage(userId);

  if (!page) {
    return null;
  }

  return {
    page,
  };
};

const toProfileBentoApiItem = (item: ProfileBentoItem): ProfileBentoApiItem => {
  const { layout, ...rest } = item;

  return {
    ...rest,
    position: layout,
  } as ProfileBentoApiItem;
};

export const getProfilePageEditorApiData = async (
  userId: string,
  handle?: string
): Promise<ProfilePageEditorApiData | null> => {
  const page = handle
    ? await getOwnedProfilePageByHandle(userId, handle)
    : await getOwnedProfilePage(userId);

  if (!page) {
    return null;
  }

  const bentoPage = await getPublicProfileBentoPageByPageId(db, page.id);

  return {
    ...page,
    bento: {
      items: bentoPage?.bento.map(toProfileBentoApiItem) ?? [],
    },
  };
};

const REQUIRED_BENTO_BREAKPOINTS = ["desktop", "compact"] as const;

const toLayoutMap = (
  layouts: Array<{
    bentoId: string;
    breakpoint: ProfileBentoBreakpoint;
    x: number;
    y: number;
    w: number;
    h: number;
  }>
) => {
  const layoutsByBentoId = new Map<
    string,
    Partial<Record<ProfileBentoBreakpoint, ProfileBentoLayout>>
  >();

  for (const layout of layouts) {
    const current = layoutsByBentoId.get(layout.bentoId) ?? {};
    current[layout.breakpoint] = {
      x: layout.x,
      y: layout.y,
      w: layout.w,
      h: layout.h,
    };
    layoutsByBentoId.set(layout.bentoId, current);
  }

  return layoutsByBentoId;
};

export const getPublicProfileBentoPageByPageId = async (
  executor: DbExecutor,
  profilePageId: string
) => {
  const page = await executor
    .select({
      id: profilePages.id,
      handle: profilePages.handle,
      updatedAt: profilePages.updatedAt,
      linkBlockPosition: profilePages.linkBlockPosition,
      location: profilePages.location,
      name: profilePages.name,
      role: profilePages.role,
      bio: profilePages.bio,
      image: profilePages.image,
      backgroundImage: profilePages.backgroundImage,
      userName: users.name,
    })
    .from(profilePages)
    .innerJoin(users, eq(profilePages.userId, users.id))
    .where(eq(profilePages.id, profilePageId))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!page) {
    return null;
  }

  const bentos = await executor
    .select({
      id: profileBentos.id,
      type: profileBentos.type,
    })
    .from(profileBentos)
    .where(eq(profileBentos.profilePageId, page.id));

  if (bentos.length === 0) {
    return {
      page,
      bento: [],
    };
  }

  const bentoIds = bentos.map((bento) => bento.id);
  const [layouts, linkBentos, textBentos, playlistBentos, sectionBentos, mediaBentos, mapBentos] =
    await Promise.all([
      executor
        .select({
          bentoId: profileBentoLayouts.bentoId,
          breakpoint: profileBentoLayouts.breakpoint,
          x: profileBentoLayouts.x,
          y: profileBentoLayouts.y,
          w: profileBentoLayouts.w,
          h: profileBentoLayouts.h,
        })
        .from(profileBentoLayouts)
        .where(inArray(profileBentoLayouts.bentoId, bentoIds)),
      executor.select().from(profileLinkBentos).where(inArray(profileLinkBentos.bentoId, bentoIds)),
      executor.select().from(profileTextBentos).where(inArray(profileTextBentos.bentoId, bentoIds)),
      executor
        .select()
        .from(profilePlaylistBentos)
        .where(inArray(profilePlaylistBentos.bentoId, bentoIds)),
      executor
        .select()
        .from(profileSectionBentos)
        .where(inArray(profileSectionBentos.bentoId, bentoIds)),
      executor
        .select()
        .from(profileMediaBentos)
        .where(inArray(profileMediaBentos.bentoId, bentoIds)),
      executor.select().from(profileMapBentos).where(inArray(profileMapBentos.bentoId, bentoIds)),
    ]);

  const layoutsByBentoId = toLayoutMap(layouts);
  const linkByBentoId = new Map(linkBentos.map((item) => [item.bentoId, item] as const));
  const textByBentoId = new Map(textBentos.map((item) => [item.bentoId, item] as const));
  const playlistByBentoId = new Map(playlistBentos.map((item) => [item.bentoId, item] as const));
  const sectionByBentoId = new Map(sectionBentos.map((item) => [item.bentoId, item] as const));
  const mediaByBentoId = new Map(mediaBentos.map((item) => [item.bentoId, item] as const));
  const mapByBentoId = new Map(mapBentos.map((item) => [item.bentoId, item] as const));
  const bento: ProfileBentoItem[] = [];

  for (const item of bentos) {
    const layout = layoutsByBentoId.get(item.id);

    if (!layout?.desktop || !layout.compact) {
      continue;
    }

    if (!REQUIRED_BENTO_BREAKPOINTS.every((breakpoint) => layout[breakpoint])) {
      continue;
    }

    if (item.type === "link") {
      const content = linkByBentoId.get(item.id);

      if (content) {
        bento.push({
          id: item.id,
          type: item.type,
          layout: {
            desktop: layout.desktop,
            compact: layout.compact,
          },
          content: {
            title: content.title,
            description: content.description,
            favicon: content.favicon,
            thumbnail: content.thumbnail,
            url: content.url,
          },
        });
      }

      continue;
    }

    if (item.type === "text") {
      const content = textByBentoId.get(item.id);

      if (content) {
        bento.push({
          id: item.id,
          type: item.type,
          layout: {
            desktop: layout.desktop,
            compact: layout.compact,
          },
          content: {
            content: content.content,
          },
        });
      }

      continue;
    }

    if (item.type === "playlist") {
      const content = playlistByBentoId.get(item.id);

      if (content) {
        bento.push({
          id: item.id,
          type: item.type,
          layout: {
            desktop: layout.desktop,
            compact: layout.compact,
          },
          content: {
            title: content.title,
            provider: toPlaylistProvider(content.provider),
            url: content.url,
            content: content.content,
          },
        });
      }

      continue;
    }

    if (item.type === "media") {
      const content = mediaByBentoId.get(item.id);

      if (content) {
        bento.push({
          id: item.id,
          type: item.type,
          layout: {
            desktop: layout.desktop,
            compact: layout.compact,
          },
          content: {
            mediaType: content.mediaType,
            url: content.url,
            objectKey: content.objectKey,
            href: content.href,
            alt: content.alt,
            caption: content.caption,
          },
        });
      }

      continue;
    }

    if (item.type === "map") {
      const content = mapByBentoId.get(item.id);

      if (content) {
        bento.push({
          id: item.id,
          type: item.type,
          layout: {
            desktop: layout.desktop,
            compact: layout.compact,
          },
          content: {
            latitude: content.latitude,
            longitude: content.longitude,
            zoom: content.zoom,
            caption: content.caption,
            url: content.url,
          },
        });
      }

      continue;
    }

    const content = sectionByBentoId.get(item.id);

    if (content) {
      bento.push({
        id: item.id,
        type: item.type,
        layout: {
          desktop: layout.desktop,
          compact: layout.compact,
        },
        content: {
          title: content.title,
        },
      });
    }
  }

  return {
    page,
    bento,
  };
};

const getPublicProfileBentoPageUncached = async (handle: string) => {
  const page = await db
    .select({
      id: profilePages.id,
    })
    .from(profilePages)
    .where(eq(profilePages.handle, handle))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!page) {
    return null;
  }

  return getPublicProfileBentoPageByPageId(db, page.id);
};

export const getPublicProfileBentoPage = unstable_cache(
  getPublicProfileBentoPageUncached,
  [PUBLIC_PROFILE_BENTO_CACHE_TAG],
  {
    revalidate: 300,
    tags: [PUBLIC_PROFILE_BENTO_CACHE_TAG],
  }
);

export const getPublicProfilePageSocialImage = async (handle: string) => {
  return db
    .select({
      handle: profilePages.handle,
      name: profilePages.name,
      role: profilePages.role,
      bio: profilePages.bio,
      image: profilePages.image,
      userName: users.name,
    })
    .from(profilePages)
    .innerJoin(users, eq(profilePages.userId, users.id))
    .where(eq(profilePages.handle, handle))
    .limit(1)
    .then((rows) => rows[0] ?? null);
};
