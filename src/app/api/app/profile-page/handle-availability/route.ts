import withAuthRequired from "@/lib/auth/withAuthRequired";
import { ProfilePageError, isHandleAvailableForUser } from "@/lib/profile-page/mutations";
import { handleSchema } from "@/lib/validations/auth.schema";
import { NextResponse } from "next/server";

export const GET = withAuthRequired(async (req, context) => {
  try {
    const { searchParams } = new URL(req.url);
    const validation = handleSchema.safeParse(searchParams.get("handle"));

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message ?? "Invalid handle." },
        { status: 400 }
      );
    }

    const available = await isHandleAvailableForUser({
      userId: context.session.user.id,
      handle: validation.data,
    });

    return NextResponse.json({ available });
  } catch (error) {
    if (error instanceof ProfilePageError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Failed to check handle availability:", error);
    return NextResponse.json({ error: "Failed to check handle availability." }, { status: 500 });
  }
});
