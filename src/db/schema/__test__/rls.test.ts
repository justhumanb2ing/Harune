import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { getTableConfig } from "drizzle-orm/pg-core";

import { coupons } from "@/db/schema/coupons";
import { creditTransactions } from "@/db/schema/credits";
import { plans } from "@/db/schema/plans";
import {
  profileLinkItems,
  profilePages,
  profileSocialLinks,
  profileTextBoxItems,
} from "@/db/schema/profile-page";
import { authAccounts, authJwks, authSessions, authVerifications, users } from "@/db/schema/user";

const policyNames = (table: Parameters<typeof getTableConfig>[0]) =>
  getTableConfig(table).policies.map((policy) => policy.name);

const expectPolicies = (actual: string[], expected: string[]) => {
  for (const policyName of expected) {
    expect(actual.includes(policyName)).toBe(true);
  }
};

const migrationSql = readFileSync(
  new URL("../../../../drizzle/0010_early_masked_marvel.sql", import.meta.url),
  "utf8"
);

describe("schema RLS configuration", () => {
  test("keeps internal auth and ledger tables closed to exposed Supabase roles", () => {
    for (const table of [
      users,
      authAccounts,
      authSessions,
      authVerifications,
      authJwks,
      creditTransactions,
      coupons,
    ]) {
      const config = getTableConfig(table);

      expect(config.enableRLS).toBe(true);
      expect(config.policies).toHaveLength(0);
    }
  });

  test("allows public reads and owner writes for profile tables", () => {
    expectPolicies(policyNames(profilePages), [
      "profile_page_public_select",
      "profile_page_owner_insert",
      "profile_page_owner_update",
      "profile_page_owner_delete",
    ]);

    expectPolicies(policyNames(profileSocialLinks), [
      "profile_social_link_public_select",
      "profile_social_link_owner_insert",
      "profile_social_link_owner_update",
      "profile_social_link_owner_delete",
    ]);

    expectPolicies(policyNames(profileLinkItems), [
      "profile_link_item_public_select",
      "profile_link_item_owner_insert",
      "profile_link_item_owner_update",
      "profile_link_item_owner_delete",
    ]);

    expectPolicies(policyNames(profileTextBoxItems), [
      "profile_text_box_item_public_select",
      "profile_text_box_item_owner_insert",
      "profile_text_box_item_owner_update",
      "profile_text_box_item_owner_delete",
    ]);
  });

  test("allows public reads for plans without exposed role writes", () => {
    const config = getTableConfig(plans);

    expect(config.enableRLS).toBe(true);
    expect(policyNames(plans)).toEqual(["plans_public_select"]);
  });

  test("migration grants only the intended exposed role privileges", () => {
    expect(
      migrationSql.includes(
        'REVOKE ALL ON TABLE "auth_account", "auth_session", "auth_verification", "app_user", "jwks", "credit_transactions", "profile_page", "profile_social_link", "profile_link_item", "profile_text_box_item", "plans" FROM "anon", "authenticated"'
      )
    ).toBe(true);
    expect(
      migrationSql.includes(
        'GRANT SELECT ON TABLE "profile_page", "profile_social_link", "profile_link_item", "profile_text_box_item", "plans" TO "anon", "authenticated"'
      )
    ).toBe(true);
    expect(
      migrationSql.includes(
        'GRANT INSERT, UPDATE, DELETE ON TABLE "profile_page", "profile_social_link", "profile_link_item", "profile_text_box_item" TO "authenticated"'
      )
    ).toBe(true);
    expect(migrationSql.includes("IF to_regclass('public.coupon') IS NOT NULL THEN")).toBe(true);
    expect(migrationSql.includes('REVOKE ALL ON TABLE "coupon" FROM "anon", "authenticated"')).toBe(
      true
    );
  });
});
