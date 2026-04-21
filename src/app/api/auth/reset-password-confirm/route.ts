import { db } from "@/db";
import { authAccounts, users } from "@/db/schema/user";
import { hashPassword } from "@/lib/auth/password";
import { decryptJson } from "@/lib/encryption/edge-jwt";
import { resetPasswordConfirmSchema } from "@/lib/validations/auth.schema";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

// Force Node.js runtime for argon2 support
export const runtime = "nodejs";

interface ResetPasswordToken {
  email: string;
  expiry: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, password, confirmPassword } = body;

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    // Validate password
    const validation = resetPasswordConfirmSchema.safeParse({
      password,
      confirmPassword,
    });
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.issues },
        { status: 400 }
      );
    }

    // Decrypt and validate token
    const resetToken = await decryptJson<ResetPasswordToken>(token);

    if (new Date(resetToken.expiry) < new Date()) {
      return NextResponse.json(
        {
          error: "Token has expired. Please request a new password reset link.",
        },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        password: users.password,
      })
      .from(users)
      .where(eq(users.email, resetToken.email))
      .limit(1)
      .then((users) => users[0]);

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Hash new password
    const hashedPassword = await hashPassword(password);

    // Update user password
    await db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.email, resetToken.email));

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
        password: hashedPassword,
      });
    } else {
      await db
        .update(authAccounts)
        .set({ password: hashedPassword, updatedAt: new Date() })
        .where(eq(authAccounts.id, credentialAccount.id));
    }

    return NextResponse.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    return NextResponse.json(
      { error: "Failed to reset password. Token may be invalid or expired." },
      { status: 500 }
    );
  }
}
