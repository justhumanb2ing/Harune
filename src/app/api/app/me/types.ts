import type { plans } from "@/db/schema/plans";
import type { profilePages } from "@/db/schema/profile-page";
import type { users } from "@/db/schema/user";

export interface MeResponse {
  currentPlan: {
    id: (typeof plans.$inferSelect)["id"];
    name: (typeof plans.$inferSelect)["name"];
    codename: (typeof plans.$inferSelect)["codename"];
    quotas: (typeof plans.$inferSelect)["quotas"];
    default: (typeof plans.$inferSelect)["default"];
  } | null;
  profilePage: {
    id: (typeof profilePages.$inferSelect)["id"];
    handle: (typeof profilePages.$inferSelect)["handle"];
    name: (typeof profilePages.$inferSelect)["name"];
    image: (typeof profilePages.$inferSelect)["image"];
  } | null;
  profilePages: Array<{
    id: (typeof profilePages.$inferSelect)["id"];
    handle: (typeof profilePages.$inferSelect)["handle"];
    name: (typeof profilePages.$inferSelect)["name"];
    image: (typeof profilePages.$inferSelect)["image"];
  }>;
  profilePageCount: number;
  user: Omit<typeof users.$inferSelect, "password">;
}
