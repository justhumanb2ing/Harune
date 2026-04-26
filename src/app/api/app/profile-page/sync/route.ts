import withAuthRequired from "@/lib/auth/withAuthRequired";
import { ProfilePageError, syncProfilePageDraft } from "@/lib/profile-page/mutations";
import { profilePageSyncSchema } from "@/lib/validations/profile-page.schema";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const noStoreHeaders = {
  "Cache-Control": "no-store",
};

export const POST = withAuthRequired(async (req, context) => {
  try {
    const body = await req.json();
    const validation = profilePageSyncSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Failed to sync" },
        { headers: noStoreHeaders, status: 400 }
      );
    }

    const data = await syncProfilePageDraft({
      userId: context.session.user.id,
      values: validation.data,
    });

    revalidatePath(`/${data.page.handle}`);
    revalidatePath(`/${data.page.handle}/app`);

    return NextResponse.json(data, { headers: noStoreHeaders });
  } catch (error) {
    if (error instanceof ProfilePageError) {
      return NextResponse.json(
        { error: error.message },
        { headers: noStoreHeaders, status: error.status }
      );
    }

    console.error("Failed to sync:", error);
    return NextResponse.json({ error: "Failed to sync" }, { headers: noStoreHeaders, status: 500 });
  }
});
