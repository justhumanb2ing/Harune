import withAuthRequired from "@/lib/auth/withAuthRequired";
import { ProfilePageError, deleteLinkItem, updateLinkItem } from "@/lib/profile-page/mutations";
import { linkItemInputSchema } from "@/lib/validations/profile-page.schema";
import { NextResponse } from "next/server";

export const PATCH = withAuthRequired(async (req, context) => {
  try {
    const body = await req.json();
    const validation = linkItemInputSchema.safeParse(body);
    const { linkId } = (await context.params) as { linkId: string };

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message ?? "Invalid link item payload." },
        { status: 400 }
      );
    }

    const linkItem = await updateLinkItem({
      userId: context.session.user.id,
      linkId,
      values: validation.data,
    });

    return NextResponse.json({ linkItem });
  } catch (error) {
    if (error instanceof ProfilePageError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Failed to update link item:", error);
    return NextResponse.json({ error: "Failed to update link item." }, { status: 500 });
  }
});

export const DELETE = withAuthRequired(async (_req, context) => {
  try {
    const { linkId } = (await context.params) as { linkId: string };
    await deleteLinkItem({
      userId: context.session.user.id,
      linkId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ProfilePageError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Failed to delete link item:", error);
    return NextResponse.json({ error: "Failed to delete link item." }, { status: 500 });
  }
});
