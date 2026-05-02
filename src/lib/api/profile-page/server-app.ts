import { auth } from "@/auth";
import {
  createLinkItem,
  deleteLinkItem,
  isHandleAvailableForUser,
  ProfilePageError,
  reorderLinkItems,
  updateLinkItem,
} from "@/lib/profile-page/mutations";
import { createProfilePageApi } from "./app";

export const profilePageApi = createProfilePageApi({
  auth,
  createLinkItem,
  deleteLinkItem,
  isHandleAvailableForUser,
  isProfilePageError: (error): error is ProfilePageError => error instanceof ProfilePageError,
  reorderLinkItems,
  updateLinkItem,
});
