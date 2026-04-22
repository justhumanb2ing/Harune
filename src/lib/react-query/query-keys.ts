export const queryKeys = {
  handles: {
    availability: (handle: string) => ["handles", "availability", handle] as const,
  },
  app: {
    me: () => ["app", "me"] as const,
    profilePage: () => ["app", "profile-page"] as const,
    organizations: () => ["app", "organizations"] as const,
    activeOrganization: () => ["app", "organizations", "active"] as const,
  },
  superAdmin: {
    stats: {
      daily: () => ["super-admin", "stats", "daily"] as const,
      plans: () => ["super-admin", "stats", "plans"] as const,
      unreadMessages: () => ["super-admin", "stats", "unread-messages"] as const,
    },
    users: {
      all: () => ["super-admin", "users"] as const,
      list: (params: { limit: number; page: number; search: string }) =>
        ["super-admin", "users", "list", params] as const,
      detail: (id: string) => ["super-admin", "users", "detail", id] as const,
      credits: (params: { id: string; limit: number; page: number }) =>
        ["super-admin", "users", "credits", params] as const,
    },
    messages: {
      all: () => ["super-admin", "messages"] as const,
      list: (params: { limit: number; page: number; search: string }) =>
        ["super-admin", "messages", "list", params] as const,
    },
    waitlist: {
      all: () => ["super-admin", "waitlist"] as const,
      list: (params: { limit: number; page: number; search: string }) =>
        ["super-admin", "waitlist", "list", params] as const,
    },
    coupons: {
      all: () => ["super-admin", "coupons"] as const,
      list: (params: { page: number; search: string; status: string }) =>
        ["super-admin", "coupons", "list", params] as const,
    },
    plans: {
      all: () => ["super-admin", "plans"] as const,
      list: (params: { limit: number; page?: number; search?: string }) =>
        ["super-admin", "plans", "list", params] as const,
      detail: (id: string) => ["super-admin", "plans", "detail", id] as const,
    },
  },
};
