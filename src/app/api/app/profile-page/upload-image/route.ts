import withAuthRequired from "@/lib/auth/withAuthRequired";
import {
  PROFILE_IMAGE_MAX_SIZE_BYTES,
  getProfileImageExtension,
  getProfileImageFileError,
} from "@/lib/profile-page/image-upload";
import {
  getMissingS3ConfigKeys,
  getPublicS3ObjectUrl,
  getS3ObjectKeyFromPublicUrl,
} from "@/lib/s3/config";
import createS3UploadFields from "@/lib/s3/createS3UploadFields";
import { deletePublicS3Object } from "@/lib/s3/deleteObject";
import { NextResponse } from "next/server";

interface UploadProfileImageRequest {
  fileName: string;
  fileType: string;
  fileSize: number;
}

interface DeleteProfileImageRequest {
  imageUrl: string;
}

export const POST = withAuthRequired(async (req, context) => {
  try {
    const { session } = context;
    const { fileName, fileType, fileSize }: UploadProfileImageRequest = await req.json();
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

    const fileExtension = getProfileImageExtension(fileName, fileType);
    const fileUuid = crypto.randomUUID();
    const s3Path = `public/users/${session.user.id}/profile-page/${fileUuid}.${fileExtension}`;

    const presignedPost = await createS3UploadFields({
      path: s3Path,
      maxSize: PROFILE_IMAGE_MAX_SIZE_BYTES,
      contentType: fileType,
    });
    const publicUrl = getPublicS3ObjectUrl(s3Path);

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
