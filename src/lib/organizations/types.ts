import type { plans } from "@/db/schema/plans";

export type OrganizationRole = "owner" | "admin" | "user";

export type OrganizationPlan = {
  id: (typeof plans.$inferSelect)["id"];
  name: (typeof plans.$inferSelect)["name"];
  codename: (typeof plans.$inferSelect)["codename"];
  default: (typeof plans.$inferSelect)["default"];
  quotas: (typeof plans.$inferSelect)["quotas"];
  requiredCouponCount: (typeof plans.$inferSelect)["requiredCouponCount"];
};

export type UserOrganizationWithPlan = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  onboardingDone: boolean;
  role: OrganizationRole;
  plan: OrganizationPlan | null;
};

export type OrganizationMemberSummary = {
  id: string;
  organizationId: string;
  userId: string;
  role: OrganizationRole;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
};
