import { db } from "@/db";
import {
  profileLinkItems,
  profilePages,
  profileSocialLinks,
  profileTextBoxItems,
} from "@/db/schema/profile-page";
import { deletePublicS3Object } from "@/lib/s3/deleteObject";
import type {
  LinkItemInput,
  ProfilePageUpdateValues,
  SocialLinkInput,
  TextBoxItemInput,
} from "@/lib/validations/profile-page.schema";
import { and, asc, desc, eq } from "drizzle-orm";

export class ProfilePageError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "ProfilePageError";
  }
}

const getOwnedPageOrThrow = async (userId: string) => {
  const page = await db
    .select({
      id: profilePages.id,
      userId: profilePages.userId,
      handle: profilePages.handle,
      name: profilePages.name,
      bio: profilePages.bio,
      image: profilePages.image,
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
      name: values.name,
      bio: values.bio,
      image: values.image,
      updatedAt: new Date(),
    })
    .where(eq(profilePages.id, ownedPage.id))
    .returning({
      id: profilePages.id,
      handle: profilePages.handle,
      name: profilePages.name,
      bio: profilePages.bio,
      image: profilePages.image,
      updatedAt: profilePages.updatedAt,
    })
    .then((rows) => rows[0] ?? null);

  if (!updatedPage) {
    throw new ProfilePageError("Failed to update profile page.", 500);
  }

  if (ownedPage.image && ownedPage.image !== values.image) {
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

    for (const [index, id] of orderedIds.entries()) {
      await tx
        .update(profileSocialLinks)
        .set({
          position: index,
          updatedAt: new Date(),
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

export const deleteLinkItem = async ({
  userId,
  linkId,
}: {
  userId: string;
  linkId: string;
}) => {
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

    for (const [index, id] of orderedIds.entries()) {
      await tx
        .update(profileLinkItems)
        .set({
          position: index,
          updatedAt: new Date(),
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
    })
    .from(profileTextBoxItems)
    .where(eq(profileTextBoxItems.profilePageId, ownedPage.id))
    .orderBy(desc(profileTextBoxItems.position))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  return db
    .insert(profileTextBoxItems)
    .values({
      profilePageId: ownedPage.id,
      title: values.title,
      description: values.description,
      position: lastItem ? lastItem.position + 1 : 0,
      updatedAt: new Date(),
    })
    .returning({
      id: profileTextBoxItems.id,
      title: profileTextBoxItems.title,
      description: profileTextBoxItems.description,
      position: profileTextBoxItems.position,
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

    for (const [index, id] of orderedIds.entries()) {
      await tx
        .update(profileTextBoxItems)
        .set({
          position: index,
          updatedAt: new Date(),
        })
        .where(eq(profileTextBoxItems.id, id));
    }
  });
};
