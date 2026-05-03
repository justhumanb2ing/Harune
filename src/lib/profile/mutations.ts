import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { db, dbClient } from "@/db";
import {
  profileBentoLayouts,
  profileBentos,
  profileLinkBentos,
  profileLinkItems,
  profileMapBentos,
  profileMediaBentos,
  profilePages,
  profilePlaylistBentos,
  profilePlaylistItems,
  profileSectionBentos,
  profileSocialLinks,
  profileTextBentos,
  profileTextBoxItems,
} from "@/db/schema/profile";
import {
  copyProfileBentoMediaObject,
  deleteProfileBentoMediaObject,
  deleteProfileMediaObject,
  getProfileBentoMediaObjectKey,
  getProfileBentoMediaObjectKeyFromUrl,
  getProfileBentoMediaPublicUrl,
  getProfileMediaObjectKeyFromUrl,
  isProfileBentoMediaObjectKeyForBento,
} from "@/lib/profile/media-storage";
import { getPublicProfileBentoPageByPageId } from "@/lib/profile/queries";
import { getS3ObjectKeyFromPublicUrl } from "@/lib/s3/config";
import { deletePublicS3Object } from "@/lib/s3/delete-object";
import type {
  LinkItemInput,
  ProfileBentoSyncValues,
  ProfilePageSyncValues,
  ProfilePageUpdateValues,
  TextBoxItemInput,
} from "@/lib/validations/profile-content.schema";

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

const withReservedDb = async <Result>(callback: (reservedDb: typeof db) => Promise<Result>) => {
  const reservedClient = await dbClient.reserve();

  try {
    return await callback(drizzle(reservedClient) as typeof db);
  } finally {
    reservedClient.release();
  }
};

const shouldDeleteReplacedProfileImage = (previousUrl: string | null, nextUrl: string | null) => {
  if (!previousUrl || previousUrl === nextUrl) {
    return false;
  }

  const previousKey =
    getProfileMediaObjectKeyFromUrl(previousUrl) ?? getS3ObjectKeyFromPublicUrl(previousUrl);
  const nextKey = nextUrl
    ? (getProfileMediaObjectKeyFromUrl(nextUrl) ?? getS3ObjectKeyFromPublicUrl(nextUrl))
    : null;

  return !previousKey || previousKey !== nextKey;
};

const deleteProfileImageObjectByUrl = async (publicUrl: string) => {
  const profileMediaObjectKey = getProfileMediaObjectKeyFromUrl(publicUrl);

  if (profileMediaObjectKey) {
    await deleteProfileMediaObject(profileMediaObjectKey);
    return;
  }

  await deletePublicS3Object(publicUrl);
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
      await deleteProfileImageObjectByUrl(ownedPage.image);
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
      await deleteProfileImageObjectByUrl(ownedPage.backgroundImage);
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

const deleteBentoContentBatch = async (tx: DbExecutor, bentoIds: string[]) => {
  if (bentoIds.length === 0) {
    return;
  }

  await Promise.all([
    tx.delete(profileBentoLayouts).where(inArray(profileBentoLayouts.bentoId, bentoIds)),
    tx.delete(profileLinkBentos).where(inArray(profileLinkBentos.bentoId, bentoIds)),
    tx.delete(profileTextBentos).where(inArray(profileTextBentos.bentoId, bentoIds)),
    tx.delete(profilePlaylistBentos).where(inArray(profilePlaylistBentos.bentoId, bentoIds)),
    tx.delete(profileSectionBentos).where(inArray(profileSectionBentos.bentoId, bentoIds)),
    tx.delete(profileMediaBentos).where(inArray(profileMediaBentos.bentoId, bentoIds)),
    tx.delete(profileMapBentos).where(inArray(profileMapBentos.bentoId, bentoIds)),
  ]);
};

const prepareMediaBentoContent = async ({
  item,
  userId,
}: {
  item: Extract<ProfileBentoSyncValues["bento"][number], { type: "media" }>;
  userId: string;
}) => {
  const finalObjectKey = getProfileBentoMediaObjectKey({
    bentoId: item.id,
    userId,
  });

  if (item.content.tempObjectKey) {
    if (
      !isProfileBentoMediaObjectKeyForBento({
        bentoId: item.id,
        objectKey: item.content.tempObjectKey,
        userId,
      })
    ) {
      throw new ProfilePageError("Invalid media upload ownership.", 400);
    }

    if (!item.content.contentHash || !item.content.contentType) {
      throw new ProfilePageError("Missing media upload metadata.", 400);
    }

    await copyProfileBentoMediaObject({
      contentHash: item.content.contentHash,
      contentType: item.content.contentType,
      fromObjectKey: item.content.tempObjectKey,
      mediaType: item.content.mediaType,
      toObjectKey: finalObjectKey,
    });

    try {
      await deleteProfileBentoMediaObject(item.content.tempObjectKey);
    } catch (error) {
      console.error("Failed to delete temporary bento media object:", {
        error,
        objectKey: item.content.tempObjectKey,
        userId,
      });
    }

    return {
      objectKey: finalObjectKey,
      url: getProfileBentoMediaPublicUrl({
        contentHash: item.content.contentHash,
        objectKey: finalObjectKey,
      }),
    };
  }

  if (
    !isProfileBentoMediaObjectKeyForBento({
      bentoId: item.id,
      objectKey: item.content.objectKey,
      userId,
    })
  ) {
    throw new ProfilePageError("Invalid media object key.", 400);
  }

  const urlObjectKey = getProfileBentoMediaObjectKeyFromUrl(item.content.url);

  if (urlObjectKey !== item.content.objectKey) {
    throw new ProfilePageError("Invalid media URL.", 400);
  }

  return {
    objectKey: item.content.objectKey,
    url: item.content.url,
  };
};

const insertBentoContent = async ({
  tx,
  item,
  now,
  userId,
}: {
  tx: DbExecutor;
  item: ProfileBentoSyncValues["bento"][number];
  now: Date;
  userId: string;
}) => {
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

  if (item.type === "media") {
    const media = await prepareMediaBentoContent({ item, userId });

    await tx.insert(profileMediaBentos).values({
      bentoId: item.id,
      mediaType: item.content.mediaType,
      url: media.url,
      objectKey: media.objectKey,
      href: item.content.href,
      alt: item.content.alt,
      caption: item.content.caption,
      updatedAt: now,
    });
    return;
  }

  if (item.type === "map") {
    await tx.insert(profileMapBentos).values({
      bentoId: item.id,
      latitude: item.content.latitude,
      longitude: item.content.longitude,
      zoom: item.content.zoom,
      caption: item.content.caption,
      url: item.content.url,
      updatedAt: now,
    });
    return;
  }

  await tx.insert(profileSectionBentos).values({
    bentoId: item.id,
    title: item.content.title,
  });
};

const insertBentoLayoutsBatch = async (
  tx: DbExecutor,
  items: ProfileBentoSyncValues["bento"],
  now: Date
) => {
  const layoutRows = items.flatMap((item) => [
    {
      bentoId: item.id,
      breakpoint: "desktop" as const,
      x: item.layout.desktop.x,
      y: item.layout.desktop.y,
      w: item.layout.desktop.w,
      h: item.layout.desktop.h,
      updatedAt: now,
    },
    {
      bentoId: item.id,
      breakpoint: "compact" as const,
      x: item.layout.compact.x,
      y: item.layout.compact.y,
      w: item.layout.compact.w,
      h: item.layout.compact.h,
      updatedAt: now,
    },
  ]);

  if (layoutRows.length > 0) {
    await tx.insert(profileBentoLayouts).values(layoutRows);
  }
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

  const { existingMediaBentos, nextData } = await withReservedDb(async (reservedDb) => {
    const existingBentos = await reservedDb
      .select({
        id: profileBentos.id,
      })
      .from(profileBentos)
      .where(eq(profileBentos.profilePageId, ownedPage.id));
    const existingMediaBentos = await reservedDb
      .select({
        objectKey: profileMediaBentos.objectKey,
      })
      .from(profileMediaBentos)
      .innerJoin(profileBentos, eq(profileMediaBentos.bentoId, profileBentos.id))
      .where(eq(profileBentos.profilePageId, ownedPage.id));
    const existingIds = new Set(existingBentos.map((item) => item.id));
    const nextIds = new Set(values.bento.map((item) => item.id));
    const nextBentoIds = values.bento.map((item) => item.id);

    const deletedBentoIds = existingBentos
      .filter((item) => !nextIds.has(item.id))
      .map((item) => item.id);

    await reservedDb.transaction(async (tx) => {
      if (deletedBentoIds.length > 0) {
        await tx.delete(profileBentos).where(inArray(profileBentos.id, deletedBentoIds));
      }

      await deleteBentoContentBatch(tx, nextBentoIds);

      for (const item of values.bento) {
        if (existingIds.has(item.id)) {
          await tx
            .update(profileBentos)
            .set({
              type: item.type,
              updatedAt: now,
            })
            .where(
              and(eq(profileBentos.id, item.id), eq(profileBentos.profilePageId, ownedPage.id))
            );
        } else {
          await tx.insert(profileBentos).values({
            id: item.id,
            profilePageId: ownedPage.id,
            type: item.type,
            updatedAt: now,
          });
        }
      }

      await insertBentoLayoutsBatch(tx, values.bento, now);

      for (const item of values.bento) {
        await insertBentoContent({ tx, item, now, userId });
      }

      await tx
        .update(profilePages)
        .set({ updatedAt: now })
        .where(eq(profilePages.id, ownedPage.id));
    });

    return {
      existingMediaBentos,
      nextData: await getPublicProfileBentoPageByPageId(reservedDb, ownedPage.id),
    };
  });

  if (!nextData) {
    throw new ProfilePageError("Profile page not found.", 404);
  }

  const nextMediaObjectKeys = new Set(
    nextData.bento.filter((item) => item.type === "media").map((item) => item.content.objectKey)
  );

  for (const media of existingMediaBentos) {
    if (nextMediaObjectKeys.has(media.objectKey)) {
      continue;
    }

    try {
      await deleteProfileBentoMediaObject(media.objectKey);
    } catch (error) {
      console.error("Failed to delete replaced bento media object:", {
        error,
        objectKey: media.objectKey,
        userId,
      });
    }
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

  const nextData = await withReservedDb(async (reservedDb) => {
    await reservedDb.transaction(async (tx) => {
      await tx
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
        tx,
        profilePageId: ownedPage.id,
        values: values.socialLinks,
      });
      await syncLinkItems({
        tx,
        profilePageId: ownedPage.id,
        values: values.linkItems,
      });
      await syncPlaylistItems({
        tx,
        profilePageId: ownedPage.id,
        values: values.playlistItems,
      });
      await syncTextBoxItems({
        tx,
        profilePageId: ownedPage.id,
        values: values.textBoxItems,
      });
    });

    return getProfilePageEditorDataByPageId(reservedDb, ownedPage.id);
  });

  if (!nextData) {
    throw new ProfilePageError("Profile page was not found after sync.", 404);
  }

  if (ownedPage.image && shouldDeleteReplacedProfileImage(ownedPage.image, values.page.image)) {
    try {
      await deleteProfileImageObjectByUrl(ownedPage.image);
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
      await deleteProfileImageObjectByUrl(ownedPage.backgroundImage);
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
