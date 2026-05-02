import { auth } from "@/auth";
import {
  createLinkItem,
  createTextBoxItem,
  deleteLinkItem,
  deleteTextBoxItem,
  isHandleAvailableForUser,
  ProfilePageError,
  reorderLinkItems,
  reorderTextBoxItems,
  updateLinkItem,
  updateTextBoxItem,
} from "@/lib/profile-page/mutations";
import { createProfilePageApi } from "./app";

export const profilePageApi = createProfilePageApi({
  auth,
  createLinkItem,
  createTextBoxItem,
  deleteLinkItem,
  deleteTextBoxItem,
  isHandleAvailableForUser,
  isProfilePageError: (error): error is ProfilePageError => error instanceof ProfilePageError,
  reorderLinkItems,
  reorderTextBoxItems,
  updateLinkItem,
  updateTextBoxItem,
});
