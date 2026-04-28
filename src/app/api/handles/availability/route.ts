import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { profilePages } from "@/db/schema/profile-page";
import { handleSchema } from "@/lib/validations/auth.schema";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const validation = handleSchema.safeParse(searchParams.get("handle"));

  if (!validation.success) {
    return NextResponse.json(
      {
        error: validation.error.issues[0]?.message ?? "Invalid handle.",
      },
      { status: 400 }
    );
  }

  const existingOwner = await db
    .select({
      id: profilePages.id,
    })
    .from(profilePages)
    .where(eq(profilePages.handle, validation.data))
    .limit(1)
    .then((rows) => rows[0]);

  return NextResponse.json({
    available: !existingOwner,
  });
}
