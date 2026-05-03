import "server-only";

import { queryOptions } from "@tanstack/react-query";
import { getProfilePageEditorData } from "@/lib/profile/queries";
import type { ProfilePageData } from "@/lib/profile/types";
import { queryKeys } from "@/lib/react-query/query-keys";

const getSerializableProfilePageEditorData = async (
  userId: string,
  handle: string
): Promise<ProfilePageData | null> => {
  const data = await getProfilePageEditorData(userId, handle);

  if (!data) {
    return null;
  }

  return {
    page: {
      id: data.page.id,
      handle: data.page.handle,
      linkBlockPosition: data.page.linkBlockPosition,
      location: data.page.location,
      name: data.page.name,
      role: data.page.role,
      bio: data.page.bio,
      image: data.page.image,
      backgroundImage: data.page.backgroundImage,
    },
  };
};

export const profilePageServerQueryOptions = (userId: string, handle: string) =>
  queryOptions({
    queryKey: queryKeys.app.profilePage(handle),
    queryFn: () => getSerializableProfilePageEditorData(userId, handle),
  });
