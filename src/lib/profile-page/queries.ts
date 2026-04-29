import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  profileLinkItems,
  profilePages,
  profilePlaylistItems,
  profileSocialLinks,
  profileTextBoxItems,
} from "@/db/schema/profile-page";
import { users } from "@/db/schema/user";

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
    .limit(1)
    .then((rows) => rows[0] ?? null);
};

export const getProfilePageEditorData = async (userId: string) => {
  const page = await getOwnedProfilePage(userId);

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
    playlistItems,
    textBoxItems,
  };
};

export const getPublicProfilePage = async (handle: string) => {
  const owner = await db
    .select({
      id: profilePages.id,
      handle: profilePages.handle,
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
    playlistItems,
    textBoxItems,
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
