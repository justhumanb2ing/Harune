import withAuthRequired from "@/lib/auth/withAuthRequired";
import {
  ProfilePageError,
  deleteTextBoxItem,
  updateTextBoxItem,
} from "@/lib/profile-page/mutations";
import { textBoxItemInputSchema } from "@/lib/validations/profile-page.schema";
import { NextResponse } from "next/server";

export const PATCH = withAuthRequired(async (req, context) => {
  try {
    const body = await req.json();
    const validation = textBoxItemInputSchema.safeParse(body);
    const { textBoxId } = (await context.params) as { textBoxId: string };

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0]?.message ?? "Invalid text box payload." },
        { status: 400 }
      );
    }

    const textBoxItem = await updateTextBoxItem({
      userId: context.session.user.id,
      textBoxId,
      values: validation.data,
    });

    return NextResponse.json({ textBoxItem });
  } catch (error) {
    if (error instanceof ProfilePageError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Failed to update text box item:", error);
    return NextResponse.json({ error: "Failed to update text box item." }, { status: 500 });
  }
});

export const DELETE = withAuthRequired(async (_req, context) => {
  try {
    const { textBoxId } = (await context.params) as { textBoxId: string };
    await deleteTextBoxItem({
      userId: context.session.user.id,
      textBoxId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof ProfilePageError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Failed to delete text box item:", error);
    return NextResponse.json({ error: "Failed to delete text box item." }, { status: 500 });
  }
});
