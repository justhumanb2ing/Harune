import "server-only";

import { queryOptions } from "@tanstack/react-query";
import { getProfileByHandle } from "@/lib/api/generated/http/profile-api/profile-api";
import { toProfilePageEditorDataFromPublicPage } from "@/lib/profile/public-profile-page";
import type { ProfilePageData } from "@/lib/profile/types";
import { queryKeys } from "@/lib/react-query/query-keys";

const getSerializableProfilePageEditorData = async (
  _userId: string,
  handle: string
): Promise<ProfilePageData | null> => {
  const response = await getProfileByHandle(handle);

  if (response.status !== 200) {
    return null;
  }

  return toProfilePageEditorDataFromPublicPage(response.data.page);
};

export const profilePageServerQueryOptions = (userId: string, handle: string) =>
  queryOptions({
    queryKey: queryKeys.app.profilePage(handle),
    queryFn: () => getSerializableProfilePageEditorData(userId, handle),
  });
