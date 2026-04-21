import { db } from "@/db";
import {
  profileLinkItems,
  profilePages,
  profileSocialLinks,
  profileTextBoxItems,
} from "@/db/schema/profile-page";
import { users } from "@/db/schema/user";
import { asc, eq } from "drizzle-orm";

export const getOwnedProfilePage = async (userId: string) => {
  return db
    .select({
      id: profilePages.id,
      userId: profilePages.userId,
      handle: profilePages.handle,
      name: profilePages.name,
      bio: profilePages.bio,
      image: profilePages.image,
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

  const [socialLinks, linkItems, textBoxItems] = await Promise.all([
    db
      .select({
        id: profileSocialLinks.id,
        platform: profileSocialLinks.platform,
        url: profileSocialLinks.url,
      })
      .from(profileSocialLinks)
      .where(eq(profileSocialLinks.profilePageId, page.id)),
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
        id: profileTextBoxItems.id,
        title: profileTextBoxItems.title,
        description: profileTextBoxItems.description,
        position: profileTextBoxItems.position,
      })
      .from(profileTextBoxItems)
      .where(eq(profileTextBoxItems.profilePageId, page.id))
      .orderBy(asc(profileTextBoxItems.position)),
  ]);

  return {
    page,
    socialLinks,
    linkItems,
    textBoxItems,
  };
};

export const getPublicProfilePage = async (handle: string) => {
  const owner = await db
    .select({
      id: profilePages.id,
      handle: profilePages.handle,
      name: profilePages.name,
      bio: profilePages.bio,
      image: profilePages.image,
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

  const [socialLinks, linkItems, textBoxItems] = await Promise.all([
    db
      .select({
        id: profileSocialLinks.id,
        platform: profileSocialLinks.platform,
        url: profileSocialLinks.url,
      })
      .from(profileSocialLinks)
      .where(eq(profileSocialLinks.profilePageId, owner.id)),
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
        id: profileTextBoxItems.id,
        title: profileTextBoxItems.title,
        description: profileTextBoxItems.description,
        position: profileTextBoxItems.position,
      })
      .from(profileTextBoxItems)
      .where(eq(profileTextBoxItems.profilePageId, owner.id))
      .orderBy(asc(profileTextBoxItems.position)),
  ]);

  return {
    ...owner,
    socialLinks,
    linkItems,
    textBoxItems,
  };
};
