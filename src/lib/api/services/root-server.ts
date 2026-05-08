import { auth } from "@/auth";
import { createRootApi } from "@/lib/api/routes/root";
import { getSafeRedirectPath, resolveAuthenticatedAppRedirect } from "@/lib/auth/app-redirect";

export const rootApi = createRootApi({
  auth,
  getSafeRedirectPath,
  resolveAuthenticatedAppRedirect,
});
