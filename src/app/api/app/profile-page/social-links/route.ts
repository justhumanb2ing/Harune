import withAuthRequired from "@/lib/auth/withAuthRequired";
import { ProfilePageError, upsertSocialLink } from "@/lib/profile-page/mutations";
import { socialLinkInputSchema } from "@/lib/validations/profile-page.schema";
import { NextResponse } from "next/server";

export const POST = withAuthRequired(async (req, context) => {
  try {
    const body = await req.json();
    const validation = socialLinkInputSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message ?? "Invalid social link payload." },
        { status: 400 }
      );
    }

    const socialLink = await upsertSocialLink({
      userId: context.session.user.id,
      values: validation.data,
    });

    return NextResponse.json({ socialLink });
  } catch (error) {
    if (error instanceof ProfilePageError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Failed to save social link:", error);
    return NextResponse.json({ error: "Failed to save social link." }, { status: 500 });
  }
});
