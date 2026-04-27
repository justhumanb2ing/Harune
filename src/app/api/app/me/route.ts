import { db } from "@/db";
import { users } from "@/db/schema/user";
import withAuthRequired from "@/lib/auth/withAuthRequired";
import { getMeForUser } from "@/lib/users/me";
import { profileUpdateSchema } from "@/lib/validations/profile.schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import type { MeResponse } from "./types";

export const dynamic = "force-dynamic";

export const GET = withAuthRequired(async (req, context) => {
  return NextResponse.json<MeResponse>(await getMeForUser(context.session.user.id));
});

export const PATCH = withAuthRequired(async (req, context) => {
  try {
    const { session } = context;
    const body = await req.json();

    // Validate input data
    const validationResult = profileUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { name, image } = validationResult.data;

    // Update user in database
    const updatedUser = await db
      .update(users)
      .set({
        name,
        image,
      })
      .where(eq(users.id, session.user.id))
      .returning();

    if (!updatedUser.length) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Return updated user data
    return NextResponse.json({
      user: updatedUser[0],
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
});
