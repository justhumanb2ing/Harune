import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { profilePages } from "@/db/schema/profile-page";
import withAuthRequired from "@/lib/auth/with-auth-required";
import {
  getProfileImageFileError,
  getProfileImageKind,
  getProfileImageObjectKey,
  PROFILE_IMAGE_MAX_SIZE_BYTES,
  withProfileImageCacheVersion,
} from "@/lib/profile-page/image-upload";
import {
  getMissingS3ConfigKeys,
  getPublicS3ObjectUrl,
  getS3ObjectKeyFromPublicUrl,
} from "@/lib/s3/config";
import createS3UploadFields from "@/lib/s3/create-s3-upload-fields";
import { deletePublicS3Object } from "@/lib/s3/delete-object";

interface UploadProfileImageRequest {
  fileName: string;
  imageHash?: string;
  imageKind?: string;
  fileType: string;
  fileSize: number;
}

interface DeleteProfileImageRequest {
  imageUrl: string;
}

interface FinalizeProfileImageRequest {
  imageKind: string;
  imageUrl: string;
}

export const POST = withAuthRequired(async (req, context) => {
  try {
    const { session } = context;
    const { fileName, fileType, fileSize, imageHash, imageKind }: UploadProfileImageRequest =
      await req.json();
    const missingConfigKeys = getMissingS3ConfigKeys();

    if (missingConfigKeys.length > 0) {
      return NextResponse.json(
        {
          error: `S3 storage is not configured: ${missingConfigKeys.join(", ")}`,
        },
        { status: 500 }
      );
    }

    if (!fileName || !fileType || !fileSize) {
      return NextResponse.json(
        { error: "Missing required fields: fileName, fileType, fileSize" },
        { status: 400 }
      );
    }

    const imageError = getProfileImageFileError({ size: fileSize, type: fileType });
    if (imageError) {
      return NextResponse.json({ error: imageError }, { status: 400 });
    }

    const profileImageKind = getProfileImageKind(imageKind);
    if (!profileImageKind) {
      return NextResponse.json({ error: "Invalid profile image kind." }, { status: 400 });
    }

    if (!imageHash || !/^[a-f0-9]{64}$/i.test(imageHash)) {
      return NextResponse.json({ error: "Invalid profile image hash." }, { status: 400 });
    }

    const s3Path = getProfileImageObjectKey(session.user.id, profileImageKind);

    const presignedPost = await createS3UploadFields({
      path: s3Path,
      maxSize: PROFILE_IMAGE_MAX_SIZE_BYTES,
      contentType: fileType,
    });
    const publicUrl = withProfileImageCacheVersion(getPublicS3ObjectUrl(s3Path), imageHash);

    return NextResponse.json({
      fields: presignedPost.fields,
      publicUrl,
      url: presignedPost.url,
    });
  } catch (error) {
    console.error("Error creating presigned URL for profile image upload:", error);
    return NextResponse.json({ error: "Failed to create upload URL" }, { status: 500 });
  }
});

export const PATCH = withAuthRequired(async (req, context) => {
  try {
    const { imageKind, imageUrl }: FinalizeProfileImageRequest = await req.json();
    const profileImageKind = getProfileImageKind(imageKind);

    if (!profileImageKind || !imageUrl) {
      return NextResponse.json({ error: "Invalid profile image payload." }, { status: 400 });
    }

    const objectKey = getS3ObjectKeyFromPublicUrl(imageUrl);
    const expectedKey = getProfileImageObjectKey(context.session.user.id, profileImageKind);

    if (objectKey !== expectedKey) {
      return NextResponse.json({ error: "Invalid profile image URL." }, { status: 400 });
    }

    const updateValues =
      profileImageKind === "background" ? { backgroundImage: imageUrl } : { image: imageUrl };

    const updatedPage = await db
      .update(profilePages)
      .set({
        ...updateValues,
        updatedAt: new Date(),
      })
      .where(eq(profilePages.userId, context.session.user.id))
      .returning({
        backgroundImage: profilePages.backgroundImage,
        image: profilePages.image,
      })
      .then((rows) => rows[0] ?? null);

    if (!updatedPage) {
      return NextResponse.json({ error: "Profile page not found." }, { status: 404 });
    }

    return NextResponse.json({
      imageUrl: profileImageKind === "background" ? updatedPage.backgroundImage : updatedPage.image,
    });
  } catch (error) {
    console.error("Error finalizing profile image upload:", error);
    return NextResponse.json({ error: "Failed to finalize profile image upload" }, { status: 500 });
  }
});

export const DELETE = withAuthRequired(async (req, context) => {
  try {
    const { imageUrl }: DeleteProfileImageRequest = await req.json();

    if (!imageUrl) {
      return NextResponse.json({ error: "Missing required field: imageUrl" }, { status: 400 });
    }

    const objectKey = getS3ObjectKeyFromPublicUrl(imageUrl);
    const expectedPrefix = `public/users/${context.session.user.id}/profile-page/`;

    if (!objectKey || !objectKey.startsWith(expectedPrefix)) {
      return NextResponse.json({ error: "Invalid profile image URL." }, { status: 400 });
    }

    await deletePublicS3Object(imageUrl);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting profile image:", error);
    return NextResponse.json({ error: "Failed to delete profile image" }, { status: 500 });
  }
});
