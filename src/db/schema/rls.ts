import { sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";

export const exposedReadRoles = ["anon", "authenticated"];
export const authenticatedWriteRole = "authenticated";

export const currentBetterAuthUserId = sql`nullif(auth.jwt() ->> 'sub', '')`;

export const isCurrentBetterAuthUser = (userIdColumn: AnyPgColumn) =>
  sql`${currentBetterAuthUserId} = ${userIdColumn}`;

export const hasProfilePage = (profilePageIdColumn: AnyPgColumn) =>
  sql`exists (
    select 1
    from "profile_page"
    where "profile_page"."id" = ${profilePageIdColumn}
  )`;

export const hasProfileBento = (bentoIdColumn: AnyPgColumn) =>
  sql`exists (
    select 1
    from "profile_bento"
    join "profile_page" on "profile_page"."id" = "profile_bento"."profilePageId"
    where "profile_bento"."id" = ${bentoIdColumn}
  )`;

export const isProfilePageOwner = (profilePageIdColumn: AnyPgColumn) =>
  sql`exists (
    select 1
    from "profile_page"
    where "profile_page"."id" = ${profilePageIdColumn}
      and "profile_page"."userId" = ${currentBetterAuthUserId}
  )`;

export const isProfileBentoOwner = (bentoIdColumn: AnyPgColumn) =>
  sql`exists (
    select 1
    from "profile_bento"
    join "profile_page" on "profile_page"."id" = "profile_bento"."profilePageId"
    where "profile_bento"."id" = ${bentoIdColumn}
      and "profile_page"."userId" = ${currentBetterAuthUserId}
  )`;
