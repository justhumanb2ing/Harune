import "server-only";

import { getProfileAnalyticsResponse } from "@/lib/analytics/profile-page-summary";
import { getOwnedProfilePage } from "@/lib/profile-page/queries";
import { queryKeys } from "@/lib/react-query/query-keys";
import { queryOptions } from "@tanstack/react-query";

type ProfileAnalyticsServerQueryOptionsParams = {
  profilePageId?: string | null;
  timezone?: string | null;
  userId: string;
};

export const profileAnalyticsServerQueryOptions = ({
  profilePageId,
  timezone,
  userId,
}: ProfileAnalyticsServerQueryOptionsParams) =>
  queryOptions({
    queryKey: queryKeys.app.profileAnalytics(),
    queryFn: async () => {
      const ownedProfilePage =
        profilePageId === undefined ? await getOwnedProfilePage(userId) : null;

      return getProfileAnalyticsResponse({
        profilePageId: profilePageId ?? ownedProfilePage?.id ?? null,
        timezone,
      });
    },
  });
