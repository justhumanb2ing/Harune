import withAuthRequired from "@/lib/auth/withAuthRequired";
import { ProfilePageError, createTextBoxItem } from "@/lib/profile-page/mutations";
import { textBoxItemInputSchema } from "@/lib/validations/profile-page.schema";
import { NextResponse } from "next/server";

export const POST = withAuthRequired(async (req, context) => {
  try {
    const body = await req.json();
    const validation = textBoxItemInputSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message ?? "Invalid text box payload." },
        { status: 400 }
      );
    }

    const textBoxItem = await createTextBoxItem({
      userId: context.session.user.id,
      values: validation.data,
    });

    return NextResponse.json({ textBoxItem });
  } catch (error) {
    if (error instanceof ProfilePageError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Failed to create text box item:", error);
    return NextResponse.json({ error: "Failed to create text box item." }, { status: 500 });
  }
});
