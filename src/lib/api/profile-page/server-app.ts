import { auth } from "@/auth";
import { isHandleAvailableForUser, ProfilePageError } from "@/lib/profile-page/mutations";
import { createProfilePageApi } from "./app";

export const profilePageApi = createProfilePageApi({
  auth,
  isHandleAvailableForUser,
  isProfilePageError: (error): error is ProfilePageError => error instanceof ProfilePageError,
});
