import { NextResponse } from "next/server";
import withAuthRequired from "@/lib/auth/with-auth-required";
import { ProfilePageError, reorderTextBoxItems } from "@/lib/profile-page/mutations";
import { reorderItemsSchema } from "@/lib/validations/profile-page.schema";

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

    await reorderTextBoxItems({
      userId: context.session.user.id,
      orderedIds: validation.data.orderedIds,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ProfilePageError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Failed to reorder text box items:", error);
    return NextResponse.json({ error: "Failed to reorder text box items." }, { status: 500 });
  }
});
