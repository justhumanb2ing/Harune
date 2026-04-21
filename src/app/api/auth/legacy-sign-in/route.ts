import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { authAccounts, users } from "@/db/schema/user";
import { verifyPassword } from "@/lib/auth/password";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };

    if (!body.email || !body.password) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const existingUser = await db
      .select({
        id: users.id,
        email: users.email,
        password: users.password,
      })
      .from(users)
      .where(eq(users.email, body.email))
      .limit(1)
      .then((rows) => rows[0]);

    if (!existingUser?.password) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isValidPassword = await verifyPassword(body.password, existingUser.password);

    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const credentialAccount = await db
      .select({ id: authAccounts.id })
      .from(authAccounts)
      .where(
        and(eq(authAccounts.userId, existingUser.id), eq(authAccounts.providerId, "credential"))
      )
      .limit(1)
      .then((rows) => rows[0]);

    if (!credentialAccount) {
      await db.insert(authAccounts).values({
        accountId: existingUser.id,
        providerId: "credential",
        userId: existingUser.id,
        password: existingUser.password,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error during legacy sign in migration:", error);
    return NextResponse.json({ error: "Failed to verify credentials" }, { status: 500 });
  }
}
