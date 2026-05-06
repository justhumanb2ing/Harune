import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profilePages } from "@/db/schema/profile";

export const getProfilePageByHandle = async (handle: string) => {
  return db
    .select({
      id: profilePages.id,
    })
    .from(profilePages)
    .where(eq(profilePages.handle, handle))
    .limit(1)
    .then((rows) => rows[0] ?? null);
};
