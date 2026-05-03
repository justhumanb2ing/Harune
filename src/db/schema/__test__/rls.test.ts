import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { getTableConfig } from "drizzle-orm/pg-core";

import { coupons } from "@/db/schema/coupons";
import { creditTransactions } from "@/db/schema/credits";
import { plans } from "@/db/schema/plans";
import {
  profileBentoLayouts,
  profileBentos,
  profileLinkBentos,
  profileMediaBentos,
  profilePages,
  profilePlaylistBentos,
  profileSectionBentos,
  profileTextBentos,
} from "@/db/schema/profile";
import { authAccounts, authJwks, authSessions, authVerifications, users } from "@/db/schema/user";

const policyNames = (table: Parameters<typeof getTableConfig>[0]) =>
  getTableConfig(table).policies.map((policy) => policy.name);

const expectPolicies = (actual: string[], expected: string[]) => {
  for (const policyName of expected) {
    expect(actual.includes(policyName)).toBe(true);
  }
};

const baseMigrationSql = readFileSync(
  new URL("../../../../drizzle/0010_early_masked_marvel.sql", import.meta.url),
  "utf8"
);
const bentoMigrationSql = readFileSync(
  new URL("../../../../drizzle/0012_brave_colossus.sql", import.meta.url),
  "utf8"
);
const mediaBentoMigrationSql = readFileSync(
  new URL("../../../../drizzle/0013_loving_deadpool.sql", import.meta.url),
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

    expectPolicies(policyNames(profileBentos), [
      "profile_bento_public_select",
      "profile_bento_owner_insert",
      "profile_bento_owner_update",
      "profile_bento_owner_delete",
    ]);

    expectPolicies(policyNames(profileBentoLayouts), [
      "profile_bento_layout_public_select",
      "profile_bento_layout_owner_insert",
      "profile_bento_layout_owner_update",
      "profile_bento_layout_owner_delete",
    ]);

    expectPolicies(policyNames(profileLinkBentos), [
      "profile_link_bento_public_select",
      "profile_link_bento_owner_insert",
      "profile_link_bento_owner_update",
      "profile_link_bento_owner_delete",
    ]);

    expectPolicies(policyNames(profileTextBentos), [
      "profile_text_bento_public_select",
      "profile_text_bento_owner_insert",
      "profile_text_bento_owner_update",
      "profile_text_bento_owner_delete",
    ]);

    expectPolicies(policyNames(profilePlaylistBentos), [
      "profile_playlist_bento_public_select",
      "profile_playlist_bento_owner_insert",
      "profile_playlist_bento_owner_update",
      "profile_playlist_bento_owner_delete",
    ]);

    expectPolicies(policyNames(profileSectionBentos), [
      "profile_section_bento_public_select",
      "profile_section_bento_owner_insert",
      "profile_section_bento_owner_update",
      "profile_section_bento_owner_delete",
    ]);

    expectPolicies(policyNames(profileMediaBentos), [
      "profile_media_bento_public_select",
      "profile_media_bento_owner_insert",
      "profile_media_bento_owner_update",
      "profile_media_bento_owner_delete",
    ]);
  });

  test("allows public reads for plans without exposed role writes", () => {
    const config = getTableConfig(plans);

    expect(config.enableRLS).toBe(true);
    expect(policyNames(plans)).toEqual(["plans_public_select"]);
  });

  test("migration grants only the intended exposed role privileges", () => {
    expect(bentoMigrationSql.includes('CREATE TABLE "profile_bento"')).toBe(true);
    expect(bentoMigrationSql.includes('CREATE TABLE "profile_bento_layout"')).toBe(true);
    expect(bentoMigrationSql.includes('CREATE TABLE "profile_link_bento"')).toBe(true);
    expect(bentoMigrationSql.includes('CREATE TABLE "profile_text_bento"')).toBe(true);
    expect(bentoMigrationSql.includes('CREATE TABLE "profile_playlist_bento"')).toBe(true);
    expect(bentoMigrationSql.includes('CREATE TABLE "profile_section_bento"')).toBe(true);
    expect(
      bentoMigrationSql.includes(
        'REVOKE ALL ON TABLE "profile_bento", "profile_bento_layout", "profile_link_bento", "profile_text_bento", "profile_playlist_bento", "profile_section_bento" FROM "anon", "authenticated"'
      )
    ).toBe(true);
    expect(
      bentoMigrationSql.includes(
        'GRANT SELECT ON TABLE "profile_bento", "profile_bento_layout", "profile_link_bento", "profile_text_bento", "profile_playlist_bento", "profile_section_bento" TO "anon", "authenticated"'
      )
    ).toBe(true);
    expect(
      bentoMigrationSql.includes(
        'GRANT INSERT, UPDATE, DELETE ON TABLE "profile_bento", "profile_bento_layout", "profile_link_bento", "profile_text_bento", "profile_playlist_bento", "profile_section_bento" TO "authenticated"'
      )
    ).toBe(true);
    expect(mediaBentoMigrationSql.includes('CREATE TABLE "profile_media_bento"')).toBe(true);
    expect(
      mediaBentoMigrationSql.includes(
        'CREATE POLICY "profile_media_bento_public_select" ON "profile_media_bento"'
      )
    ).toBe(true);
    expect(
      mediaBentoMigrationSql.includes(
        'REVOKE ALL ON TABLE "profile_media_bento" FROM "anon", "authenticated"'
      )
    ).toBe(true);
    expect(
      mediaBentoMigrationSql.includes(
        'GRANT SELECT ON TABLE "profile_media_bento" TO "anon", "authenticated"'
      )
    ).toBe(true);
    expect(
      mediaBentoMigrationSql.includes(
        'GRANT INSERT, UPDATE, DELETE ON TABLE "profile_media_bento" TO "authenticated"'
      )
    ).toBe(true);
    expect(baseMigrationSql.includes("IF to_regclass('public.coupon') IS NOT NULL THEN")).toBe(
      true
    );
    expect(
      baseMigrationSql.includes('REVOKE ALL ON TABLE "coupon" FROM "anon", "authenticated"')
    ).toBe(true);
  });
});
