import { and, asc, desc, eq } from "drizzle-orm";
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
import { getPublicProfileBentoPage } from "@/lib/profile-page/queries";
import { getS3ObjectKeyFromPublicUrl } from "@/lib/s3/config";
import { deletePublicS3Object } from "@/lib/s3/delete-object";
import type {
  LinkItemInput,
  ProfileBentoSyncValues,
  ProfilePageSyncValues,
  ProfilePageUpdateValues,
  SocialLinkInput,
  TextBoxItemInput,
} from "@/lib/validations/profile-page.schema";

export class ProfilePageError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "ProfilePageError";
  }
}

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type DbExecutor = typeof db | DbTransaction;

const shouldDeleteReplacedProfileImage = (previousUrl: string | null, nextUrl: string | null) => {
  if (!previousUrl || previousUrl === nextUrl) {
    return false;
  }

  const previousKey = getS3ObjectKeyFromPublicUrl(previousUrl);
  const nextKey = nextUrl ? getS3ObjectKeyFromPublicUrl(nextUrl) : null;

  return !previousKey || previousKey !== nextKey;
};

const getProfilePageEditorDataByPageId = async (executor: DbExecutor, profilePageId: string) => {
  const page = await executor
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
    })
    .from(profilePages)
    .where(eq(profilePages.id, profilePageId))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!page) {
    throw new ProfilePageError("Profile page not found.", 404);
  }

  const [socialLinks, linkItems, playlistItems, textBoxItems] = await Promise.all([
    executor
      .select({
        id: profileSocialLinks.id,
        platform: profileSocialLinks.platform,
        url: profileSocialLinks.url,
        position: profileSocialLinks.position,
      })
      .from(profileSocialLinks)
      .where(eq(profileSocialLinks.profilePageId, profilePageId))
      .orderBy(asc(profileSocialLinks.position)),
    executor
      .select({
        id: profileLinkItems.id,
        title: profileLinkItems.title,
        description: profileLinkItems.description,
        favicon: profileLinkItems.favicon,
        url: profileLinkItems.url,
        position: profileLinkItems.position,
      })
      .from(profileLinkItems)
      .where(eq(profileLinkItems.profilePageId, profilePageId))
      .orderBy(asc(profileLinkItems.position)),
    executor
      .select({
        id: profilePlaylistItems.id,
        title: profilePlaylistItems.title,
        provider: profilePlaylistItems.provider,
        content: profilePlaylistItems.content,
        position: profilePlaylistItems.position,
        blockPosition: profilePlaylistItems.blockPosition,
      })
      .from(profilePlaylistItems)
      .where(eq(profilePlaylistItems.profilePageId, profilePageId))
      .orderBy(asc(profilePlaylistItems.position)),
    executor
      .select({
        id: profileTextBoxItems.id,
        title: profileTextBoxItems.title,
        description: profileTextBoxItems.description,
        position: profileTextBoxItems.position,
        blockPosition: profileTextBoxItems.blockPosition,
      })
      .from(profileTextBoxItems)
      .where(eq(profileTextBoxItems.profilePageId, profilePageId))
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

const getOwnedPageOrThrow = async (userId: string) => {
  const page = await db
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
    })
    .from(profilePages)
    .where(eq(profilePages.userId, userId))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!page) {
    throw new ProfilePageError("Profile page not found.", 404);
  }

  return page;
};

export const isHandleAvailableForUser = async ({
  userId,
  handle,
}: {
  userId: string;
  handle: string;
}) => {
  const ownedPage = await getOwnedPageOrThrow(userId);
  const existingOwner = await db
    .select({
      id: profilePages.id,
    })
    .from(profilePages)
    .where(eq(profilePages.handle, handle))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  return !existingOwner || existingOwner.id === ownedPage.id;
};

export const updateProfileMetadata = async ({
  userId,
  values,
}: {
  userId: string;
  values: ProfilePageUpdateValues;
}) => {
  const ownedPage = await getOwnedPageOrThrow(userId);

  const existingOwner = await db
    .select({
      id: profilePages.id,
    })
    .from(profilePages)
    .where(eq(profilePages.handle, values.handle))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (existingOwner && existingOwner.id !== ownedPage.id) {
    throw new ProfilePageError("This handle is already taken.", 409);
  }

  const updatedPage = await db
    .update(profilePages)
    .set({
      handle: values.handle,
      location: values.location === undefined ? ownedPage.location : values.location,
      name: values.name,
      role: values.role === undefined ? ownedPage.role : values.role,
      bio: values.bio,
      image: values.image,
      backgroundImage:
        values.backgroundImage === undefined ? ownedPage.backgroundImage : values.backgroundImage,
      updatedAt: new Date(),
    })
    .where(eq(profilePages.id, ownedPage.id))
    .returning({
      id: profilePages.id,
      handle: profilePages.handle,
      linkBlockPosition: profilePages.linkBlockPosition,
      location: profilePages.location,
      name: profilePages.name,
      role: profilePages.role,
      bio: profilePages.bio,
      image: profilePages.image,
      backgroundImage: profilePages.backgroundImage,
      updatedAt: profilePages.updatedAt,
    })
    .then((rows) => rows[0] ?? null);

  if (!updatedPage) {
    throw new ProfilePageError("Failed to update profile page.", 500);
  }

  if (ownedPage.image && shouldDeleteReplacedProfileImage(ownedPage.image, values.image)) {
    try {
      await deletePublicS3Object(ownedPage.image);
    } catch (error) {
      console.error("Failed to delete profile image from storage:", {
        error,
        imageUrl: ownedPage.image,
        userId,
      });
    }
  }

  const nextBackgroundImage =
    values.backgroundImage === undefined ? ownedPage.backgroundImage : values.backgroundImage;

  if (
    ownedPage.backgroundImage &&
    shouldDeleteReplacedProfileImage(ownedPage.backgroundImage, nextBackgroundImage)
  ) {
    try {
      await deletePublicS3Object(ownedPage.backgroundImage);
    } catch (error) {
      console.error("Failed to delete profile background image from storage:", {
        error,
        imageUrl: ownedPage.backgroundImage,
        userId,
      });
    }
  }

  return updatedPage;
};

export const upsertSocialLink = async ({
  userId,
  values,
}: {
  userId: string;
  values: SocialLinkInput;
}) => {
  const ownedPage = await getOwnedPageOrThrow(userId);

  const existingLink = await db
    .select({
      id: profileSocialLinks.id,
      position: profileSocialLinks.position,
    })
    .from(profileSocialLinks)
    .where(
      and(
        eq(profileSocialLinks.profilePageId, ownedPage.id),
        eq(profileSocialLinks.platform, values.platform)
      )
    )
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (existingLink) {
    return db
      .update(profileSocialLinks)
      .set({
        url: values.url,
        updatedAt: new Date(),
      })
      .where(eq(profileSocialLinks.id, existingLink.id))
      .returning({
        id: profileSocialLinks.id,
        platform: profileSocialLinks.platform,
        url: profileSocialLinks.url,
        position: profileSocialLinks.position,
      })
      .then((rows) => rows[0]);
  }

  const lastLink = await db
    .select({
      position: profileSocialLinks.position,
    })
    .from(profileSocialLinks)
    .where(eq(profileSocialLinks.profilePageId, ownedPage.id))
    .orderBy(desc(profileSocialLinks.position))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  return db
    .insert(profileSocialLinks)
    .values({
      profilePageId: ownedPage.id,
      platform: values.platform,
      url: values.url,
      position: lastLink ? lastLink.position + 1 : 0,
      updatedAt: new Date(),
    })
    .returning({
      id: profileSocialLinks.id,
      platform: profileSocialLinks.platform,
      url: profileSocialLinks.url,
      position: profileSocialLinks.position,
    })
    .then((rows) => rows[0]);
};

export const deleteSocialLink = async ({
  userId,
  socialLinkId,
}: {
  userId: string;
  socialLinkId: string;
}) => {
  const ownedPage = await getOwnedPageOrThrow(userId);

  return db.transaction(async (tx) => {
    const deleted = await tx
      .delete(profileSocialLinks)
      .where(
        and(
          eq(profileSocialLinks.id, socialLinkId),
          eq(profileSocialLinks.profilePageId, ownedPage.id)
        )
      )
      .returning({
        id: profileSocialLinks.id,
      })
      .then((rows) => rows[0] ?? null);

    if (!deleted) {
      throw new ProfilePageError("Social link not found.", 404);
    }

    const remainingLinks = await tx
      .select({
        id: profileSocialLinks.id,
        position: profileSocialLinks.position,
      })
      .from(profileSocialLinks)
      .where(eq(profileSocialLinks.profilePageId, ownedPage.id))
      .orderBy(asc(profileSocialLinks.position));

    for (const [index, link] of remainingLinks.entries()) {
      if (link.position !== index) {
        await tx
          .update(profileSocialLinks)
          .set({
            position: index,
            updatedAt: new Date(),
          })
          .where(eq(profileSocialLinks.id, link.id));
      }
    }

    return deleted;
  });
};

export const reorderSocialLinks = async ({
  userId,
  orderedIds,
}: {
  userId: string;
  orderedIds: string[];
}) => {
  const ownedPage = await getOwnedPageOrThrow(userId);
  const uniqueOrderedIds = new Set(orderedIds);

  if (uniqueOrderedIds.size !== orderedIds.length) {
    throw new ProfilePageError("Duplicate IDs are not allowed.", 400);
  }

  await db.transaction(async (tx) => {
    const currentLinks = await tx
      .select({
        id: profileSocialLinks.id,
      })
      .from(profileSocialLinks)
      .where(eq(profileSocialLinks.profilePageId, ownedPage.id))
      .orderBy(asc(profileSocialLinks.position));

    if (currentLinks.length !== orderedIds.length) {
      throw new ProfilePageError("Ordered IDs do not match current items.", 400);
    }

    const currentIds = currentLinks.map((item) => item.id).sort();
    const nextIds = [...orderedIds].sort();

    if (currentIds.some((id, index) => id !== nextIds[index])) {
      throw new ProfilePageError("Ordered IDs do not match current items.", 400);
    }

    const now = new Date();

    for (const [index, link] of currentLinks.entries()) {
      await tx
        .update(profileSocialLinks)
        .set({
          position: -(index + 1),
          updatedAt: now,
        })
        .where(eq(profileSocialLinks.id, link.id));
    }

    for (const [index, id] of orderedIds.entries()) {
      await tx
        .update(profileSocialLinks)
        .set({
          position: index,
          updatedAt: now,
        })
        .where(eq(profileSocialLinks.id, id));
    }
  });
};

export const createLinkItem = async ({
  userId,
  values,
}: {
  userId: string;
  values: LinkItemInput;
}) => {
  const ownedPage = await getOwnedPageOrThrow(userId);
  const lastItem = await db
    .select({
      position: profileLinkItems.position,
    })
    .from(profileLinkItems)
    .where(eq(profileLinkItems.profilePageId, ownedPage.id))
    .orderBy(desc(profileLinkItems.position))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  return db
    .insert(profileLinkItems)
    .values({
      profilePageId: ownedPage.id,
      title: values.title,
      description: values.description,
      favicon: values.favicon,
      url: values.url,
      position: lastItem ? lastItem.position + 1 : 0,
      updatedAt: new Date(),
    })
    .returning({
      id: profileLinkItems.id,
      title: profileLinkItems.title,
      description: profileLinkItems.description,
      favicon: profileLinkItems.favicon,
      url: profileLinkItems.url,
      position: profileLinkItems.position,
    })
    .then((rows) => rows[0]);
};

export const updateLinkItem = async ({
  userId,
  linkId,
  values,
}: {
  userId: string;
  linkId: string;
  values: LinkItemInput;
}) => {
  const ownedPage = await getOwnedPageOrThrow(userId);
  const updated = await db
    .update(profileLinkItems)
    .set({
      title: values.title,
      description: values.description,
      favicon: values.favicon,
      url: values.url,
      updatedAt: new Date(),
    })
    .where(and(eq(profileLinkItems.id, linkId), eq(profileLinkItems.profilePageId, ownedPage.id)))
    .returning({
      id: profileLinkItems.id,
      title: profileLinkItems.title,
      description: profileLinkItems.description,
      favicon: profileLinkItems.favicon,
      url: profileLinkItems.url,
      position: profileLinkItems.position,
    })
    .then((rows) => rows[0] ?? null);

  if (!updated) {
    throw new ProfilePageError("Link item not found.", 404);
  }

  return updated;
};

export const deleteLinkItem = async ({ userId, linkId }: { userId: string; linkId: string }) => {
  const ownedPage = await getOwnedPageOrThrow(userId);

  await db.transaction(async (tx) => {
    const deleted = await tx
      .delete(profileLinkItems)
      .where(and(eq(profileLinkItems.id, linkId), eq(profileLinkItems.profilePageId, ownedPage.id)))
      .returning({
        id: profileLinkItems.id,
      })
      .then((rows) => rows[0] ?? null);

    if (!deleted) {
      throw new ProfilePageError("Link item not found.", 404);
    }

    const remainingItems = await tx
      .select({
        id: profileLinkItems.id,
        position: profileLinkItems.position,
      })
      .from(profileLinkItems)
      .where(eq(profileLinkItems.profilePageId, ownedPage.id))
      .orderBy(asc(profileLinkItems.position));

    for (const [index, item] of remainingItems.entries()) {
      if (item.position !== index) {
        await tx
          .update(profileLinkItems)
          .set({
            position: index,
            updatedAt: new Date(),
          })
          .where(eq(profileLinkItems.id, item.id));
      }
    }
  });
};

export const reorderLinkItems = async ({
  userId,
  orderedIds,
}: {
  userId: string;
  orderedIds: string[];
}) => {
  const ownedPage = await getOwnedPageOrThrow(userId);
  const uniqueOrderedIds = new Set(orderedIds);

  if (uniqueOrderedIds.size !== orderedIds.length) {
    throw new ProfilePageError("Duplicate IDs are not allowed.", 400);
  }

  await db.transaction(async (tx) => {
    const currentItems = await tx
      .select({
        id: profileLinkItems.id,
      })
      .from(profileLinkItems)
      .where(eq(profileLinkItems.profilePageId, ownedPage.id))
      .orderBy(asc(profileLinkItems.position));

    if (currentItems.length !== orderedIds.length) {
      throw new ProfilePageError("Ordered IDs do not match current items.", 400);
    }

    const currentIds = currentItems.map((item) => item.id).sort();
    const nextIds = [...orderedIds].sort();

    if (currentIds.some((id, index) => id !== nextIds[index])) {
      throw new ProfilePageError("Ordered IDs do not match current items.", 400);
    }

    const now = new Date();

    for (const [index, item] of currentItems.entries()) {
      await tx
        .update(profileLinkItems)
        .set({
          position: -(index + 1),
          updatedAt: now,
        })
        .where(eq(profileLinkItems.id, item.id));
    }

    for (const [index, id] of orderedIds.entries()) {
      await tx
        .update(profileLinkItems)
        .set({
          position: index,
          updatedAt: now,
        })
        .where(eq(profileLinkItems.id, id));
    }
  });
};

export const createTextBoxItem = async ({
  userId,
  values,
}: {
  userId: string;
  values: TextBoxItemInput;
}) => {
  const ownedPage = await getOwnedPageOrThrow(userId);
  const lastItem = await db
    .select({
      position: profileTextBoxItems.position,
      blockPosition: profileTextBoxItems.blockPosition,
    })
    .from(profileTextBoxItems)
    .where(eq(profileTextBoxItems.profilePageId, ownedPage.id))
    .orderBy(desc(profileTextBoxItems.position))
    .limit(1)
    .then((rows) => rows[0] ?? null);
  const lastBlockPosition = Math.max(ownedPage.linkBlockPosition, lastItem?.blockPosition ?? -1);

  return db
    .insert(profileTextBoxItems)
    .values({
      profilePageId: ownedPage.id,
      title: values.title,
      description: values.description,
      position: lastItem ? lastItem.position + 1 : 0,
      blockPosition: lastBlockPosition + 1,
      updatedAt: new Date(),
    })
    .returning({
      id: profileTextBoxItems.id,
      title: profileTextBoxItems.title,
      description: profileTextBoxItems.description,
      position: profileTextBoxItems.position,
      blockPosition: profileTextBoxItems.blockPosition,
    })
    .then((rows) => rows[0]);
};

export const updateTextBoxItem = async ({
  userId,
  textBoxId,
  values,
}: {
  userId: string;
  textBoxId: string;
  values: TextBoxItemInput;
}) => {
  const ownedPage = await getOwnedPageOrThrow(userId);
  const updated = await db
    .update(profileTextBoxItems)
    .set({
      title: values.title,
      description: values.description,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(profileTextBoxItems.id, textBoxId),
        eq(profileTextBoxItems.profilePageId, ownedPage.id)
      )
    )
    .returning({
      id: profileTextBoxItems.id,
      title: profileTextBoxItems.title,
      description: profileTextBoxItems.description,
      position: profileTextBoxItems.position,
      blockPosition: profileTextBoxItems.blockPosition,
    })
    .then((rows) => rows[0] ?? null);

  if (!updated) {
    throw new ProfilePageError("Text box item not found.", 404);
  }

  return updated;
};

export const deleteTextBoxItem = async ({
  userId,
  textBoxId,
}: {
  userId: string;
  textBoxId: string;
}) => {
  const ownedPage = await getOwnedPageOrThrow(userId);

  await db.transaction(async (tx) => {
    const deleted = await tx
      .delete(profileTextBoxItems)
      .where(
        and(
          eq(profileTextBoxItems.id, textBoxId),
          eq(profileTextBoxItems.profilePageId, ownedPage.id)
        )
      )
      .returning({
        id: profileTextBoxItems.id,
      })
      .then((rows) => rows[0] ?? null);

    if (!deleted) {
      throw new ProfilePageError("Text box item not found.", 404);
    }

    const remainingItems = await tx
      .select({
        id: profileTextBoxItems.id,
        position: profileTextBoxItems.position,
      })
      .from(profileTextBoxItems)
      .where(eq(profileTextBoxItems.profilePageId, ownedPage.id))
      .orderBy(asc(profileTextBoxItems.position));

    for (const [index, item] of remainingItems.entries()) {
      if (item.position !== index) {
        await tx
          .update(profileTextBoxItems)
          .set({
            position: index,
            updatedAt: new Date(),
          })
          .where(eq(profileTextBoxItems.id, item.id));
      }
    }
  });
};

export const reorderTextBoxItems = async ({
  userId,
  orderedIds,
}: {
  userId: string;
  orderedIds: string[];
}) => {
  const ownedPage = await getOwnedPageOrThrow(userId);
  const uniqueOrderedIds = new Set(orderedIds);

  if (uniqueOrderedIds.size !== orderedIds.length) {
    throw new ProfilePageError("Duplicate IDs are not allowed.", 400);
  }

  await db.transaction(async (tx) => {
    const currentItems = await tx
      .select({
        id: profileTextBoxItems.id,
      })
      .from(profileTextBoxItems)
      .where(eq(profileTextBoxItems.profilePageId, ownedPage.id))
      .orderBy(asc(profileTextBoxItems.position));

    if (currentItems.length !== orderedIds.length) {
      throw new ProfilePageError("Ordered IDs do not match current items.", 400);
    }

    const currentIds = currentItems.map((item) => item.id).sort();
    const nextIds = [...orderedIds].sort();

    if (currentIds.some((id, index) => id !== nextIds[index])) {
      throw new ProfilePageError("Ordered IDs do not match current items.", 400);
    }

    const now = new Date();

    for (const [index, item] of currentItems.entries()) {
      await tx
        .update(profileTextBoxItems)
        .set({
          position: -(index + 1),
          updatedAt: now,
        })
        .where(eq(profileTextBoxItems.id, item.id));
    }

    for (const [index, id] of orderedIds.entries()) {
      await tx
        .update(profileTextBoxItems)
        .set({
          position: index,
          updatedAt: now,
        })
        .where(eq(profileTextBoxItems.id, id));
    }
  });
};

const syncSocialLinks = async ({
  tx,
  profilePageId,
  values,
}: {
  tx: DbExecutor;
  profilePageId: string;
  values: ProfilePageSyncValues["socialLinks"];
}) => {
  const existingLinks = await tx
    .select({
      id: profileSocialLinks.id,
      platform: profileSocialLinks.platform,
    })
    .from(profileSocialLinks)
    .where(eq(profileSocialLinks.profilePageId, profilePageId));
  const existingIdsByPlatform = new Map(
    existingLinks.map((link) => [link.platform, link.id] as const)
  );
  const nextPlatforms = new Set(values.map((link) => link.platform));
  const now = new Date();

  for (const [index, link] of existingLinks.entries()) {
    await tx
      .update(profileSocialLinks)
      .set({
        position: -(index + 1),
        updatedAt: now,
      })
      .where(eq(profileSocialLinks.id, link.id));
  }

  for (const link of existingLinks) {
    if (!nextPlatforms.has(link.platform)) {
      await tx.delete(profileSocialLinks).where(eq(profileSocialLinks.id, link.id));
    }
  }

  for (const socialLink of values) {
    const existingId = existingIdsByPlatform.get(socialLink.platform);

    if (existingId) {
      await tx
        .update(profileSocialLinks)
        .set({
          url: socialLink.url,
          position: socialLink.position,
          updatedAt: now,
        })
        .where(eq(profileSocialLinks.id, existingId));
      continue;
    }

    await tx.insert(profileSocialLinks).values({
      profilePageId,
      platform: socialLink.platform,
      url: socialLink.url,
      position: socialLink.position,
      updatedAt: now,
    });
  }
};

const syncLinkItems = async ({
  tx,
  profilePageId,
  values,
}: {
  tx: DbExecutor;
  profilePageId: string;
  values: ProfilePageSyncValues["linkItems"];
}) => {
  const existingItems = await tx
    .select({
      id: profileLinkItems.id,
    })
    .from(profileLinkItems)
    .where(eq(profileLinkItems.profilePageId, profilePageId));
  const existingIds = new Set(existingItems.map((item) => item.id));
  const nextIds = new Set(values.map((item) => item.id));
  const now = new Date();

  for (const [index, item] of existingItems.entries()) {
    await tx
      .update(profileLinkItems)
      .set({
        position: -(index + 1),
        updatedAt: now,
      })
      .where(eq(profileLinkItems.id, item.id));
  }

  for (const item of existingItems) {
    if (!nextIds.has(item.id)) {
      await tx.delete(profileLinkItems).where(eq(profileLinkItems.id, item.id));
    }
  }

  for (const linkItem of values) {
    if (existingIds.has(linkItem.id)) {
      await tx
        .update(profileLinkItems)
        .set({
          title: linkItem.title,
          description: linkItem.description || null,
          favicon: linkItem.favicon || null,
          url: linkItem.url,
          position: linkItem.position,
          updatedAt: now,
        })
        .where(eq(profileLinkItems.id, linkItem.id));
      continue;
    }

    await tx.insert(profileLinkItems).values({
      profilePageId,
      title: linkItem.title,
      description: linkItem.description || null,
      favicon: linkItem.favicon || null,
      url: linkItem.url,
      position: linkItem.position,
      updatedAt: now,
    });
  }
};

const syncPlaylistItems = async ({
  tx,
  profilePageId,
  values,
}: {
  tx: DbExecutor;
  profilePageId: string;
  values: ProfilePageSyncValues["playlistItems"];
}) => {
  const existingItems = await tx
    .select({
      id: profilePlaylistItems.id,
    })
    .from(profilePlaylistItems)
    .where(eq(profilePlaylistItems.profilePageId, profilePageId));
  const existingIds = new Set(existingItems.map((item) => item.id));
  const nextIds = new Set(values.map((item) => item.id));
  const now = new Date();

  for (const [index, item] of existingItems.entries()) {
    await tx
      .update(profilePlaylistItems)
      .set({
        position: -(index + 1),
        updatedAt: now,
      })
      .where(eq(profilePlaylistItems.id, item.id));
  }

  for (const item of existingItems) {
    if (!nextIds.has(item.id)) {
      await tx.delete(profilePlaylistItems).where(eq(profilePlaylistItems.id, item.id));
    }
  }

  for (const playlistItem of values) {
    if (existingIds.has(playlistItem.id)) {
      await tx
        .update(profilePlaylistItems)
        .set({
          title: playlistItem.title,
          provider: playlistItem.provider,
          content: playlistItem.content,
          position: playlistItem.position,
          blockPosition: playlistItem.blockPosition,
          updatedAt: now,
        })
        .where(eq(profilePlaylistItems.id, playlistItem.id));
      continue;
    }

    await tx.insert(profilePlaylistItems).values({
      profilePageId,
      title: playlistItem.title,
      provider: playlistItem.provider,
      content: playlistItem.content,
      position: playlistItem.position,
      blockPosition: playlistItem.blockPosition,
      updatedAt: now,
    });
  }
};

const syncTextBoxItems = async ({
  tx,
  profilePageId,
  values,
}: {
  tx: DbExecutor;
  profilePageId: string;
  values: ProfilePageSyncValues["textBoxItems"];
}) => {
  const existingItems = await tx
    .select({
      id: profileTextBoxItems.id,
    })
    .from(profileTextBoxItems)
    .where(eq(profileTextBoxItems.profilePageId, profilePageId));
  const existingIds = new Set(existingItems.map((item) => item.id));
  const nextIds = new Set(values.map((item) => item.id));
  const now = new Date();

  for (const [index, item] of existingItems.entries()) {
    await tx
      .update(profileTextBoxItems)
      .set({
        position: -(index + 1),
        updatedAt: now,
      })
      .where(eq(profileTextBoxItems.id, item.id));
  }

  for (const item of existingItems) {
    if (!nextIds.has(item.id)) {
      await tx.delete(profileTextBoxItems).where(eq(profileTextBoxItems.id, item.id));
    }
  }

  for (const textBoxItem of values) {
    if (existingIds.has(textBoxItem.id)) {
      await tx
        .update(profileTextBoxItems)
        .set({
          title: textBoxItem.title,
          description: textBoxItem.description || null,
          position: textBoxItem.position,
          blockPosition: textBoxItem.blockPosition,
          updatedAt: now,
        })
        .where(eq(profileTextBoxItems.id, textBoxItem.id));
      continue;
    }

    await tx.insert(profileTextBoxItems).values({
      profilePageId,
      title: textBoxItem.title,
      description: textBoxItem.description || null,
      position: textBoxItem.position,
      blockPosition: textBoxItem.blockPosition,
      updatedAt: now,
    });
  }
};

const deleteBentoContent = async (tx: DbExecutor, bentoId: string) => {
  await tx.delete(profileBentoLayouts).where(eq(profileBentoLayouts.bentoId, bentoId));
  await tx.delete(profileLinkBentos).where(eq(profileLinkBentos.bentoId, bentoId));
  await tx.delete(profileTextBentos).where(eq(profileTextBentos.bentoId, bentoId));
  await tx.delete(profilePlaylistBentos).where(eq(profilePlaylistBentos.bentoId, bentoId));
  await tx.delete(profileSectionBentos).where(eq(profileSectionBentos.bentoId, bentoId));
};

const insertBentoContent = async ({
  tx,
  item,
  now,
}: {
  tx: DbExecutor;
  item: ProfileBentoSyncValues["bento"][number];
  now: Date;
}) => {
  await tx.insert(profileBentoLayouts).values([
    {
      bentoId: item.id,
      breakpoint: "desktop",
      x: item.layout.desktop.x,
      y: item.layout.desktop.y,
      w: item.layout.desktop.w,
      h: item.layout.desktop.h,
      updatedAt: now,
    },
    {
      bentoId: item.id,
      breakpoint: "compact",
      x: item.layout.compact.x,
      y: item.layout.compact.y,
      w: item.layout.compact.w,
      h: item.layout.compact.h,
      updatedAt: now,
    },
  ]);

  if (item.type === "link") {
    await tx.insert(profileLinkBentos).values({
      bentoId: item.id,
      title: item.content.title,
      description: item.content.description || null,
      favicon: item.content.favicon || null,
      thumbnail: item.content.thumbnail || null,
      url: item.content.url,
      updatedAt: now,
    });
    return;
  }

  if (item.type === "text") {
    await tx.insert(profileTextBentos).values({
      bentoId: item.id,
      content: item.content.content,
      updatedAt: now,
    });
    return;
  }

  if (item.type === "playlist") {
    await tx.insert(profilePlaylistBentos).values({
      bentoId: item.id,
      title: item.content.title,
      provider: item.content.provider,
      url: item.content.url,
      content: item.content.content,
      updatedAt: now,
    });
    return;
  }

  await tx.insert(profileSectionBentos).values({
    bentoId: item.id,
    title: item.content.title,
  });
};

export const syncProfileBentoDraft = async ({
  userId,
  values,
}: {
  userId: string;
  values: ProfileBentoSyncValues;
}) => {
  const ownedPage = await getOwnedPageOrThrow(userId);
  const now = new Date();

  await db.transaction(async (tx) => {
    const existingBentos = await tx
      .select({
        id: profileBentos.id,
      })
      .from(profileBentos)
      .where(eq(profileBentos.profilePageId, ownedPage.id));
    const existingIds = new Set(existingBentos.map((item) => item.id));
    const nextIds = new Set(values.bento.map((item) => item.id));

    for (const item of existingBentos) {
      if (!nextIds.has(item.id)) {
        await tx.delete(profileBentos).where(eq(profileBentos.id, item.id));
      }
    }

    for (const item of values.bento) {
      if (existingIds.has(item.id)) {
        await tx
          .update(profileBentos)
          .set({
            type: item.type,
            updatedAt: now,
          })
          .where(and(eq(profileBentos.id, item.id), eq(profileBentos.profilePageId, ownedPage.id)));
      } else {
        await tx.insert(profileBentos).values({
          id: item.id,
          profilePageId: ownedPage.id,
          type: item.type,
          updatedAt: now,
        });
      }

      await deleteBentoContent(tx, item.id);
      await insertBentoContent({ tx, item, now });
    }
  });

  const nextData = await getPublicProfileBentoPage(ownedPage.handle);

  if (!nextData) {
    throw new ProfilePageError("Profile page not found.", 404);
  }

  return nextData;
};

export const syncProfilePageDraft = async ({
  userId,
  values,
}: {
  userId: string;
  values: ProfilePageSyncValues;
}) => {
  const ownedPage = await getOwnedPageOrThrow(userId);

  const existingOwner = await db
    .select({
      id: profilePages.id,
    })
    .from(profilePages)
    .where(eq(profilePages.handle, values.page.handle))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (existingOwner && existingOwner.id !== ownedPage.id) {
    throw new ProfilePageError("This handle is already taken.", 409);
  }

  await db
    .update(profilePages)
    .set({
      handle: values.page.handle,
      linkBlockPosition: values.page.linkBlockPosition,
      location: values.page.location || null,
      name: values.page.name,
      role: values.page.role || null,
      bio: values.page.bio || null,
      image: values.page.image,
      backgroundImage: values.page.backgroundImage,
      updatedAt: new Date(),
    })
    .where(eq(profilePages.id, ownedPage.id));

  await syncSocialLinks({
    tx: db,
    profilePageId: ownedPage.id,
    values: values.socialLinks,
  });
  await syncLinkItems({
    tx: db,
    profilePageId: ownedPage.id,
    values: values.linkItems,
  });
  await syncPlaylistItems({
    tx: db,
    profilePageId: ownedPage.id,
    values: values.playlistItems,
  });
  await syncTextBoxItems({
    tx: db,
    profilePageId: ownedPage.id,
    values: values.textBoxItems,
  });

  const nextData = await getProfilePageEditorDataByPageId(db, ownedPage.id);

  if (ownedPage.image && shouldDeleteReplacedProfileImage(ownedPage.image, values.page.image)) {
    try {
      await deletePublicS3Object(ownedPage.image);
    } catch (error) {
      console.error("Failed to delete profile image from storage after sync:", {
        error,
        imageUrl: ownedPage.image,
        userId,
      });
    }
  }

  if (
    ownedPage.backgroundImage &&
    shouldDeleteReplacedProfileImage(ownedPage.backgroundImage, values.page.backgroundImage)
  ) {
    try {
      await deletePublicS3Object(ownedPage.backgroundImage);
    } catch (error) {
      console.error("Failed to delete profile background image from storage after sync:", {
        error,
        imageUrl: ownedPage.backgroundImage,
        userId,
      });
    }
  }

  return nextData;
};
