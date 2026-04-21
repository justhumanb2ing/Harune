import { db } from "@/db";
import { users } from "@/db/schema/user";
import { waitlist } from "@/db/schema/waitlist";
import withSuperAdminAuthRequired from "@/lib/auth/withSuperAdminAuthRequired";
import { format, startOfDay, subDays } from "date-fns";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export const GET = withSuperAdminAuthRequired(async () => {
  const thirtyDaysAgo = startOfDay(subDays(new Date(), 30));

  const [userSignups, waitlistEntries] = await Promise.all([
    db
      .select({
        date: sql<string>`DATE(${users.createdAt})::text`,
        count: sql<number>`COUNT(*)`,
      })
      .from(users)
      .where(sql`${users.createdAt} >= ${thirtyDaysAgo}`)
      .groupBy(sql`DATE(${users.createdAt})`)
      .orderBy(sql`DATE(${users.createdAt})`),
    db
      .select({
        date: sql<string>`DATE(${waitlist.createdAt})::text`,
        count: sql<number>`COUNT(*)`,
      })
      .from(waitlist)
      .where(sql`${waitlist.createdAt} >= ${thirtyDaysAgo}`)
      .groupBy(sql`DATE(${waitlist.createdAt})`)
      .orderBy(sql`DATE(${waitlist.createdAt})`),
  ]);

  const signupCounts = new Map(userSignups.map((signup) => [signup.date, Number(signup.count)]));
  const waitlistCounts = new Map(waitlistEntries.map((entry) => [entry.date, Number(entry.count)]));

  // Generate array of last 30 days
  const dates = Array.from({ length: 31 }, (_, i) => {
    const date = format(subDays(new Date(), i), "yyyy-MM-dd");
    return {
      date,
      users: signupCounts.get(date) ?? 0,
      waitlist: waitlistCounts.get(date) ?? 0,
    };
  }).reverse();

  return NextResponse.json({ data: dates });
});
