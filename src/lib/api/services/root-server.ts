import { auth } from "@/auth";
import { getProfilePageByHandle } from "@/lib/api/repositories/root";
import { createRootApi } from "@/lib/api/routes/root";
import { getSafeRedirectPath, resolveAuthenticatedAppRedirect } from "@/lib/auth/app-redirect";
import { fetchUrlMetadata } from "@/lib/metadata/url-metadata";

export const rootApi = createRootApi({
  auth,
  fetchUrlMetadata,
  getProfilePageByHandle,
  getSafeRedirectPath,
  resolveAuthenticatedAppRedirect,
});
