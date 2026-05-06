import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profilePages } from "@/db/schema/profile";
import type { ProfileImageKind } from "@/lib/profile/image-upload";

export const updateProfileImage = async ({
  imageKind,
  imageUrl,
  userId,
}: {
  imageKind: ProfileImageKind;
  imageUrl: string;
  userId: string;
}) => {
  const updateValues =
    imageKind === "background" ? { backgroundImage: imageUrl } : { image: imageUrl };

  return db
    .update(profilePages)
    .set({
      ...updateValues,
      updatedAt: new Date(),
    })
    .where(eq(profilePages.userId, userId))
    .returning({
      backgroundImage: profilePages.backgroundImage,
      image: profilePages.image,
    })
    .then((rows) => rows[0] ?? null);
};
