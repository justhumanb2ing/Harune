import type { plans } from "@/db/schema/plans";
import type { users } from "@/db/schema/user";

export interface MeResponse {
  currentPlan: {
    id: (typeof plans.$inferSelect)["id"];
    name: (typeof plans.$inferSelect)["name"];
    codename: (typeof plans.$inferSelect)["codename"];
    quotas: (typeof plans.$inferSelect)["quotas"];
    default: (typeof plans.$inferSelect)["default"];
  } | null;
  user: Omit<typeof users.$inferSelect, "password">;
}
