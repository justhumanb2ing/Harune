import { NextResponse } from "next/server";
import withAuthRequired from "@/lib/auth/with-auth-required";
import { deleteSocialLink, ProfilePageError } from "@/lib/profile-page/mutations";

export const DELETE = withAuthRequired(async (_req, context) => {
  try {
    const { socialLinkId } = (await context.params) as { socialLinkId: string };
    await deleteSocialLink({
      userId: context.session.user.id,
      socialLinkId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ProfilePageError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Failed to delete social link:", error);
    return NextResponse.json({ error: "Failed to delete social link." }, { status: 500 });
  }
});
