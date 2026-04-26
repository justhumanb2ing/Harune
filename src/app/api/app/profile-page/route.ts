import withAuthRequired from "@/lib/auth/withAuthRequired";
import { ProfilePageError, updateProfileMetadata } from "@/lib/profile-page/mutations";
import { getProfilePageEditorData } from "@/lib/profile-page/queries";
import { profilePageUpdateSchema } from "@/lib/validations/profile-page.schema";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const noStoreHeaders = {
  "Cache-Control": "no-store",
};

export const GET = withAuthRequired(async (_req, context) => {
  const data = await getProfilePageEditorData(context.session.user.id);

  if (!data) {
    return NextResponse.json(
      { error: "Profile page not found." },
      { headers: noStoreHeaders, status: 404 }
    );
  }

  return NextResponse.json(data, { headers: noStoreHeaders });
});

export const PATCH = withAuthRequired(async (req, context) => {
  try {
    const body = await req.json();
    const validation = profilePageUpdateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message ?? "Invalid profile page payload." },
        { status: 400 }
      );
    }

    const page = await updateProfileMetadata({
      userId: context.session.user.id,
      values: validation.data,
    });

    return NextResponse.json({ page });
  } catch (error) {
    if (error instanceof ProfilePageError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Failed to update profile page:", error);
    return NextResponse.json({ error: "Failed to update profile page." }, { status: 500 });
  }
});
