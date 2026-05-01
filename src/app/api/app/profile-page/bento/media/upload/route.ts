import { NextResponse } from "next/server";
import withAuthRequired from "@/lib/auth/with-auth-required";
import {
  getProfileBentoMediaPublicUrl,
  getTemporaryProfileBentoMediaObjectKey,
  hashProfileBentoMediaBuffer,
  putTemporaryProfileBentoMediaObject,
} from "@/lib/profile-page/media-storage";
import {
  getProfileBentoMediaFileError,
  getProfileBentoMediaType,
} from "@/lib/profile-page/media-upload";

export const dynamic = "force-dynamic";

const noStoreHeaders = {
  "Cache-Control": "no-store",
};

export const POST = withAuthRequired(async (req, context) => {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const bentoId = formData.get("bentoId");

    if (!(file instanceof File) || typeof bentoId !== "string" || bentoId.trim().length === 0) {
      return NextResponse.json(
        { error: "Missing required media upload fields." },
        { headers: noStoreHeaders, status: 400 }
      );
    }

    const fileError = getProfileBentoMediaFileError(file);
    if (fileError) {
      return NextResponse.json({ error: fileError }, { headers: noStoreHeaders, status: 400 });
    }

    const mediaType = getProfileBentoMediaType(file.type);
    if (!mediaType) {
      return NextResponse.json(
        { error: "Unsupported media type." },
        { headers: noStoreHeaders, status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const contentHash = hashProfileBentoMediaBuffer(buffer);
    const tempObjectKey = getTemporaryProfileBentoMediaObjectKey({
      bentoId,
      userId: context.session.user.id,
    });

    await putTemporaryProfileBentoMediaObject({
      body: buffer,
      contentType: file.type,
      objectKey: tempObjectKey,
    });

    return NextResponse.json(
      {
        contentHash,
        contentType: file.type,
        mediaType,
        tempObjectKey,
        tempUrl: getProfileBentoMediaPublicUrl({
          contentHash,
          objectKey: tempObjectKey,
        }),
      },
      { headers: noStoreHeaders }
    );
  } catch (error) {
    console.error("Failed to upload bento media:", error);
    return NextResponse.json(
      { error: "Failed to upload media." },
      { headers: noStoreHeaders, status: 500 }
    );
  }
});
