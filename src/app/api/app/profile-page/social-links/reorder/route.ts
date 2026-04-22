import withAuthRequired from "@/lib/auth/withAuthRequired";
import { ProfilePageError, reorderSocialLinks } from "@/lib/profile-page/mutations";
import { reorderItemsSchema } from "@/lib/validations/profile-page.schema";
import { NextResponse } from "next/server";

export const POST = withAuthRequired(async (req, context) => {
  try {
    const body = await req.json();
    const validation = reorderItemsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message ?? "Invalid reorder payload." },
        { status: 400 }
      );
    }

    await reorderSocialLinks({
      userId: context.session.user.id,
      orderedIds: validation.data.orderedIds,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ProfilePageError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Failed to reorder social links:", error);
    return NextResponse.json({ error: "Failed to reorder social links." }, { status: 500 });
  }
});
