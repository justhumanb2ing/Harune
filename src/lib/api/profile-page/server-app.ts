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
  updateProfileMetadata,
  updateTextBoxItem,
} from "@/lib/profile-page/mutations";
import { getProfilePageEditorData } from "@/lib/profile-page/queries";
import { createProfilePageApi } from "./app";

export const profilePageApi = createProfilePageApi({
  auth,
  createLinkItem,
  createTextBoxItem,
  deleteLinkItem,
  deleteTextBoxItem,
  getProfilePageEditorData,
  isHandleAvailableForUser,
  isProfilePageError: (error): error is ProfilePageError => error instanceof ProfilePageError,
  reorderLinkItems,
  reorderTextBoxItems,
  updateLinkItem,
  updateProfileMetadata,
  updateTextBoxItem,
});
