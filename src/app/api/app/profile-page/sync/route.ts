import withAuthRequired from "@/lib/auth/withAuthRequired";
import { ProfilePageError, syncProfilePageDraft } from "@/lib/profile-page/mutations";
import { profilePageSyncSchema } from "@/lib/validations/profile-page.schema";
import { NextResponse } from "next/server";

export const POST = withAuthRequired(async (req, context) => {
  try {
    const body = await req.json();
    const validation = profilePageSyncSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message ?? "Invalid profile page sync payload." },
        { status: 400 }
      );
    }

    const data = await syncProfilePageDraft({
      userId: context.session.user.id,
      values: validation.data,
    });

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ProfilePageError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Failed to sync profile page:", error);
    return NextResponse.json({ error: "Failed to sync profile page." }, { status: 500 });
  }
});
