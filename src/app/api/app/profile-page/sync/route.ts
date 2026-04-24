import withAuthRequired from "@/lib/auth/withAuthRequired";
import { ProfilePageError, syncProfilePageDraft } from "@/lib/profile-page/mutations";
import { profilePageSyncSchema } from "@/lib/validations/profile-page.schema";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export const POST = withAuthRequired(async (req, context) => {
  try {
    const body = await req.json();
    const validation = profilePageSyncSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Failed to sync" }, { status: 400 });
    }

    const data = await syncProfilePageDraft({
      userId: context.session.user.id,
      values: validation.data,
    });

    revalidatePath(`/${data.page.handle}`);

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof ProfilePageError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Failed to sync:", error);
    return NextResponse.json({ error: "Failed to sync" }, { status: 500 });
  }
});
