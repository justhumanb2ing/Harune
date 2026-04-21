import { db } from "@/db";
import { waitlist } from "@/db/schema/waitlist";
import withSuperAdminAuthRequired from "@/lib/auth/withSuperAdminAuthRequired";
import { desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export const GET = withSuperAdminAuthRequired(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const page = Number.parseInt(searchParams.get("page") || "1");
    const limit = Number.parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";

    const offset = (page - 1) * limit;

    const where = search
      ? sql`email LIKE ${`%${search}%`} OR name LIKE ${`%${search}%`}`
      : sql`1=1`;

    const [totalCountResult, entries] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(waitlist).where(where),
      db
        .select()
        .from(waitlist)
        .where(where)
        .orderBy(desc(waitlist.createdAt))
        .limit(limit)
        .offset(offset),
    ]);

    const totalCount = Number(totalCountResult[0]?.count ?? 0);

    return NextResponse.json({
      entries,
      pagination: {
        total: totalCount,
        pageCount: Math.ceil(totalCount / limit),
        currentPage: page,
        perPage: limit,
      },
    });
  } catch (error) {
    console.error("Error fetching waitlist entries:", error);
    return NextResponse.json({ error: "Failed to fetch waitlist entries" }, { status: 500 });
  }
});

export const DELETE = withSuperAdminAuthRequired(async (req) => {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Entry ID is required" }, { status: 400 });
    }

    await db.delete(waitlist).where(eq(waitlist.id, Number.parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting waitlist entry:", error);
    return NextResponse.json({ error: "Failed to delete waitlist entry" }, { status: 500 });
  }
});
