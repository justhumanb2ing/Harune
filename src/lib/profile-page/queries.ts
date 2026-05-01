import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  profileBentoLayouts,
  profileBentos,
  profileLinkBentos,
  profileLinkItems,
  profilePages,
  profilePlaylistBentos,
  profilePlaylistItems,
  profileSectionBentos,
  profileSocialLinks,
  profileTextBentos,
  profileTextBoxItems,
} from "@/db/schema/profile-page";
import { users } from "@/db/schema/user";
import type { PlaylistProvider } from "@/lib/profile-page/playlist";
import type {
  ProfileBentoBreakpoint,
  ProfileBentoItem,
  ProfileBentoLayout,
} from "@/lib/profile-page/types";

const toPlaylistProvider = (provider: string): PlaylistProvider => provider as PlaylistProvider;

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

  const [socialLinks, linkItems, playlistItems, textBoxItems] = await Promise.all([
    db
      .select({
        id: profileSocialLinks.id,
        platform: profileSocialLinks.platform,
        url: profileSocialLinks.url,
        position: profileSocialLinks.position,
      })
      .from(profileSocialLinks)
      .where(eq(profileSocialLinks.profilePageId, page.id))
      .orderBy(asc(profileSocialLinks.position)),
    db
      .select({
        id: profileLinkItems.id,
        title: profileLinkItems.title,
        description: profileLinkItems.description,
        favicon: profileLinkItems.favicon,
        url: profileLinkItems.url,
        position: profileLinkItems.position,
      })
      .from(profileLinkItems)
      .where(eq(profileLinkItems.profilePageId, page.id))
      .orderBy(asc(profileLinkItems.position)),
    db
      .select({
        id: profilePlaylistItems.id,
        title: profilePlaylistItems.title,
        provider: profilePlaylistItems.provider,
        content: profilePlaylistItems.content,
        position: profilePlaylistItems.position,
        blockPosition: profilePlaylistItems.blockPosition,
      })
      .from(profilePlaylistItems)
      .where(eq(profilePlaylistItems.profilePageId, page.id))
      .orderBy(asc(profilePlaylistItems.position)),
    db
      .select({
        id: profileTextBoxItems.id,
        title: profileTextBoxItems.title,
        description: profileTextBoxItems.description,
        position: profileTextBoxItems.position,
        blockPosition: profileTextBoxItems.blockPosition,
      })
      .from(profileTextBoxItems)
      .where(eq(profileTextBoxItems.profilePageId, page.id))
      .orderBy(asc(profileTextBoxItems.position)),
  ]);

  return {
    page,
    socialLinks,
    linkItems,
    playlistItems: playlistItems.map((playlistItem) => ({
      ...playlistItem,
      provider: toPlaylistProvider(playlistItem.provider),
    })),
    textBoxItems,
  };
};

export const getPublicProfilePage = async (handle: string) => {
  const owner = await db
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
    .where(eq(profilePages.handle, handle))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!owner) {
    return null;
  }

  const [socialLinks, linkItems, playlistItems, textBoxItems] = await Promise.all([
    db
      .select({
        id: profileSocialLinks.id,
        platform: profileSocialLinks.platform,
        url: profileSocialLinks.url,
        position: profileSocialLinks.position,
      })
      .from(profileSocialLinks)
      .where(eq(profileSocialLinks.profilePageId, owner.id))
      .orderBy(asc(profileSocialLinks.position)),
    db
      .select({
        id: profileLinkItems.id,
        title: profileLinkItems.title,
        description: profileLinkItems.description,
        favicon: profileLinkItems.favicon,
        url: profileLinkItems.url,
        position: profileLinkItems.position,
      })
      .from(profileLinkItems)
      .where(eq(profileLinkItems.profilePageId, owner.id))
      .orderBy(asc(profileLinkItems.position)),
    db
      .select({
        id: profilePlaylistItems.id,
        title: profilePlaylistItems.title,
        provider: profilePlaylistItems.provider,
        content: profilePlaylistItems.content,
        position: profilePlaylistItems.position,
        blockPosition: profilePlaylistItems.blockPosition,
      })
      .from(profilePlaylistItems)
      .where(eq(profilePlaylistItems.profilePageId, owner.id))
      .orderBy(asc(profilePlaylistItems.position)),
    db
      .select({
        id: profileTextBoxItems.id,
        title: profileTextBoxItems.title,
        description: profileTextBoxItems.description,
        position: profileTextBoxItems.position,
        blockPosition: profileTextBoxItems.blockPosition,
      })
      .from(profileTextBoxItems)
      .where(eq(profileTextBoxItems.profilePageId, owner.id))
      .orderBy(asc(profileTextBoxItems.position)),
  ]);

  return {
    ...owner,
    socialLinks,
    linkItems,
    playlistItems: playlistItems.map((playlistItem) => ({
      ...playlistItem,
      provider: toPlaylistProvider(playlistItem.provider),
    })),
    textBoxItems,
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

export const getPublicProfileBentoPage = async (handle: string) => {
  const page = await db
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
    .where(eq(profilePages.handle, handle))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!page) {
    return null;
  }

  const bentos = await db
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
  const [layouts, linkBentos, textBentos, playlistBentos, sectionBentos] = await Promise.all([
    db
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
    db.select().from(profileLinkBentos).where(inArray(profileLinkBentos.bentoId, bentoIds)),
    db.select().from(profileTextBentos).where(inArray(profileTextBentos.bentoId, bentoIds)),
    db.select().from(profilePlaylistBentos).where(inArray(profilePlaylistBentos.bentoId, bentoIds)),
    db.select().from(profileSectionBentos).where(inArray(profileSectionBentos.bentoId, bentoIds)),
  ]);

  const layoutsByBentoId = toLayoutMap(layouts);
  const linkByBentoId = new Map(linkBentos.map((item) => [item.bentoId, item] as const));
  const textByBentoId = new Map(textBentos.map((item) => [item.bentoId, item] as const));
  const playlistByBentoId = new Map(playlistBentos.map((item) => [item.bentoId, item] as const));
  const sectionByBentoId = new Map(sectionBentos.map((item) => [item.bentoId, item] as const));
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
