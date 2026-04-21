import { db } from "@/db";
import { contacts } from "@/db/schema/contact";
import withSuperAdminAuthRequired from "@/lib/auth/withSuperAdminAuthRequired";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export const GET = withSuperAdminAuthRequired(async () => {
  const unreadCount = await db
    .select({
      count: sql<number>`COUNT(*)`,
    })
    .from(contacts)
    .where(sql`${contacts.readAt} IS NULL`);

  return NextResponse.json({ data: Number(unreadCount[0].count) });
});
