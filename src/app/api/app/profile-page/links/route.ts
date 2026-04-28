import { NextResponse } from "next/server";
import withAuthRequired from "@/lib/auth/with-auth-required";
import { createLinkItem, ProfilePageError } from "@/lib/profile-page/mutations";
import { linkItemInputSchema } from "@/lib/validations/profile-page.schema";

export const POST = withAuthRequired(async (req, context) => {
  try {
    const body = await req.json();
    const validation = linkItemInputSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message ?? "Invalid link item payload." },
        { status: 400 }
      );
    }

    const linkItem = await createLinkItem({
      userId: context.session.user.id,
      values: validation.data,
    });

    return NextResponse.json({ linkItem });
  } catch (error) {
    if (error instanceof ProfilePageError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Failed to create link item:", error);
    return NextResponse.json({ error: "Failed to create link item." }, { status: 500 });
  }
});
