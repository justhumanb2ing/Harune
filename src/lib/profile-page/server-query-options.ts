import "server-only";

import { queryOptions } from "@tanstack/react-query";
import { getProfilePageEditorData } from "@/lib/profile-page/queries";
import type { ProfilePageData } from "@/lib/profile-page/types";
import { queryKeys } from "@/lib/react-query/query-keys";

const getSerializableProfilePageEditorData = async (
  userId: string
): Promise<ProfilePageData | null> => {
  const data = await getProfilePageEditorData(userId);

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
    socialLinks: data.socialLinks,
    linkItems: data.linkItems,
    playlistItems: data.playlistItems,
    textBoxItems: data.textBoxItems,
  };
};

export const profilePageServerQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: queryKeys.app.profilePage(),
    queryFn: () => getSerializableProfilePageEditorData(userId),
  });
