import "server-only";

import { getProfileAnalyticsResponse } from "@/lib/analytics/profile-page-summary";
import { getOwnedProfilePage } from "@/lib/profile-page/queries";
import { queryKeys } from "@/lib/react-query/query-keys";
import { queryOptions } from "@tanstack/react-query";

type ProfileAnalyticsServerQueryOptionsParams = {
  userId: string;
};

export const profileAnalyticsServerQueryOptions = ({
  userId,
}: ProfileAnalyticsServerQueryOptionsParams) =>
  queryOptions({
    queryKey: queryKeys.app.profileAnalytics(),
    queryFn: async () => {
      const profilePage = await getOwnedProfilePage(userId);

      return getProfileAnalyticsResponse({
        profilePageId: profilePage?.id ?? null,
      });
    },
  });
