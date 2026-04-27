export const queryKeys = {
  handles: {
    availability: (handle: string) => ["handles", "availability", handle] as const,
  },
  app: {
    all: () => ["app"] as const,
    me: () => ["app", "me"] as const,
    profileAnalytics: () => ["app", "profile-analytics"] as const,
    profilePage: () => ["app", "profile-page"] as const,
  },
};
