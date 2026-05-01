import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import withAuthRequired from "@/lib/auth/with-auth-required";
import { ProfilePageError, syncProfileBentoDraft } from "@/lib/profile-page/mutations";
import { profileBentoSyncSchema } from "@/lib/validations/profile-page.schema";

export const dynamic = "force-dynamic";

const noStoreHeaders = {
  "Cache-Control": "no-store",
};

export const POST = withAuthRequired(async (req, context) => {
  try {
    const body = await req.json();
    const validation = profileBentoSyncSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Failed to sync bento" },
        { headers: noStoreHeaders, status: 400 }
      );
    }

    const data = await syncProfileBentoDraft({
      userId: context.session.user.id,
      values: validation.data,
    });

    revalidatePath(`/v2/${data.page.handle}`);

    return NextResponse.json(data, { headers: noStoreHeaders });
  } catch (error) {
    if (error instanceof ProfilePageError) {
      return NextResponse.json(
        { error: error.message },
        { headers: noStoreHeaders, status: error.status }
      );
    }

    console.error("Failed to sync bento:", error);
    return NextResponse.json(
      { error: "Failed to sync bento" },
      { headers: noStoreHeaders, status: 500 }
    );
  }
});
