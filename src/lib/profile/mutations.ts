import { and, eq, inArray } from "drizzle-orm";
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
  ProfileBentoSyncValues,
  ProfilePageSyncValues,
  ProfilePageUpdateValues,
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

  return {
    page,
  };
};

const getOwnedPageOrThrow = async (userId: string) => {
  const page = await db
    .select({
      id: profilePages.id,
      userId: profilePages.userId,
      handle: profilePages.handle,
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
      description: null,
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

  const existingBentos = await db
    .select({
      id: profileBentos.id,
    })
    .from(profileBentos)
    .where(eq(profileBentos.profilePageId, ownedPage.id));
  const existingMediaBentos = await db
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

  await db.transaction(async (tx) => {
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
          .where(and(eq(profileBentos.id, item.id), eq(profileBentos.profilePageId, ownedPage.id)));
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

    await tx.update(profilePages).set({ updatedAt: now }).where(eq(profilePages.id, ownedPage.id));
  });

  const nextData = await getPublicProfileBentoPageByPageId(db, ownedPage.id);

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

  await db.transaction(async (tx) => {
    await tx
      .update(profilePages)
      .set({
        handle: values.page.handle,
        location: values.page.location || null,
        name: values.page.name,
        role: values.page.role || null,
        bio: values.page.bio || null,
        image: values.page.image,
        backgroundImage: values.page.backgroundImage,
        updatedAt: new Date(),
      })
      .where(eq(profilePages.id, ownedPage.id));
  });

  const nextData = await getProfilePageEditorDataByPageId(db, ownedPage.id);

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
