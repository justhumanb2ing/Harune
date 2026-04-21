import withAuthRequired from "@/lib/auth/withAuthRequired";
import { getMissingS3ConfigKeys, getPublicS3ObjectUrl } from "@/lib/s3/config";
import createS3UploadFields from "@/lib/s3/createS3UploadFields";
import { NextResponse } from "next/server";

interface UploadAvatarRequest {
  fileName: string;
  fileType: string;
  fileSize: number;
}

export const POST = withAuthRequired(async (req, context) => {
  try {
    const { session } = context;
    const { fileName, fileType, fileSize }: UploadAvatarRequest = await req.json();
    const missingConfigKeys = getMissingS3ConfigKeys();

    if (missingConfigKeys.length > 0) {
      return NextResponse.json(
        {
          error: `S3 storage is not configured: ${missingConfigKeys.join(", ")}`,
        },
        { status: 500 }
      );
    }

    // Validate input
    if (!fileName || !fileType || !fileSize) {
      return NextResponse.json(
        { error: "Missing required fields: fileName, fileType, fileSize" },
        { status: 400 }
      );
    }

    // Validate file type (only allow images for avatars)
    if (!fileType.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed for avatars" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB for avatars)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (fileSize > maxSize) {
      return NextResponse.json(
        { error: "File size too large. Maximum allowed size is 5MB" },
        { status: 400 }
      );
    }

    // Extract file extension
    const fileExtension = fileName.split(".").pop()?.toLowerCase() || "jpg";

    // Generate UUID for filename
    const fileUuid = crypto.randomUUID();

    // Construct S3 path: /public/users/<user-id>/avatars/<filename-uuid>.format
    const s3Path = `public/users/${session.user.id}/avatars/${fileUuid}.${fileExtension}`;

    // Create presigned URL
    const presignedPost = await createS3UploadFields({
      path: s3Path,
      maxSize: maxSize,
      contentType: fileType,
    });
    const publicUrl = getPublicS3ObjectUrl(s3Path);

    return NextResponse.json({
      fields: presignedPost.fields,
      publicUrl,
      url: presignedPost.url,
    });
  } catch (error) {
    console.error("Error creating presigned URL for avatar upload:", error);
    return NextResponse.json({ error: "Failed to create upload URL" }, { status: 500 });
  }
});
