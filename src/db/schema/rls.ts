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

export const isProfilePageOwner = (profilePageIdColumn: AnyPgColumn) =>
  sql`exists (
    select 1
    from "profile_page"
    where "profile_page"."id" = ${profilePageIdColumn}
      and "profile_page"."userId" = ${currentBetterAuthUserId}
  )`;
