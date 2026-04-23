import { normalizeAnalyticsTimezone } from "@/lib/analytics/analytics-ranges";
import { getProfileAnalyticsResponse } from "@/lib/analytics/profile-page-summary";
import withAuthRequired from "@/lib/auth/withAuthRequired";
import { getOwnedProfilePage } from "@/lib/profile-page/queries";
import { NextResponse } from "next/server";

export const GET = withAuthRequired(async (req, context) => {
  try {
    const timezone = normalizeAnalyticsTimezone(req.nextUrl.searchParams.get("timezone"));
    const profilePage = await getOwnedProfilePage(context.session.user.id);
    const response = await getProfileAnalyticsResponse({
      profilePageId: profilePage?.id ?? null,
      timezone,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to load profile analytics:", error);

    return NextResponse.json({ error: "Failed to load profile analytics." }, { status: 500 });
  }
});
