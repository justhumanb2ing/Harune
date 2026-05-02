import { auth } from "@/auth";
import {
  createLinkItem,
  isHandleAvailableForUser,
  ProfilePageError,
} from "@/lib/profile-page/mutations";
import { createProfilePageApi } from "./app";

export const profilePageApi = createProfilePageApi({
  auth,
  createLinkItem,
  isHandleAvailableForUser,
  isProfilePageError: (error): error is ProfilePageError => error instanceof ProfilePageError,
});
