import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { profilePages } from "@/db/schema/profile";
import { getSafeRedirectPath, resolveAuthenticatedAppRedirect } from "@/lib/auth/app-redirect";
import { fetchUrlMetadata } from "@/lib/metadata/url-metadata";
import { createRootApi } from "./app";

const getProfilePageByHandle = async (handle: string) => {
  return db
    .select({
      id: profilePages.id,
    })
    .from(profilePages)
    .where(eq(profilePages.handle, handle))
    .limit(1)
    .then((rows) => rows[0] ?? null);
};

export const rootApi = createRootApi({
  auth,
  fetchUrlMetadata,
  getProfilePageByHandle,
  getSafeRedirectPath,
  resolveAuthenticatedAppRedirect,
});
