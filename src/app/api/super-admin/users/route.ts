import { db } from "@/db";
import { users } from "@/db/schema/user";
import withSuperAdminAuthRequired from "@/lib/auth/withSuperAdminAuthRequired";
import { desc, sql } from "drizzle-orm";
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

    const [totalCountResult, usersList] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(users).where(where),
      db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          image: users.image,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(where)
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset),
    ]);

    const totalCount = Number(totalCountResult[0]?.count ?? 0);

    return NextResponse.json({
      users: usersList,
      pagination: {
        total: totalCount,
        pageCount: Math.ceil(totalCount / limit),
        currentPage: page,
        perPage: limit,
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
});
