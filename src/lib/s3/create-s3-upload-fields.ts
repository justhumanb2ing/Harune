import {
  createPresignedPost,
  type PresignedPost,
  type PresignedPostOptions,
} from "@aws-sdk/s3-presigned-post";
import s3 from "./client";
import { getS3StorageConfig } from "./config";

const createS3UploadFields = async ({
  path,
  maxSize,
  contentType,
}: {
  path: string;
  maxSize?: number;
  contentType?: string;
}): Promise<PresignedPost> => {
  const config = getS3StorageConfig();

  if (!config.bucket) {
    throw new Error("S3 bucket is not set");
  }

  const conditions: NonNullable<PresignedPostOptions["Conditions"]> = [];

  if (maxSize) {
    conditions.push(["content-length-range", 0, maxSize]);
  }

  if (contentType) {
    conditions.push(["eq", "$Content-Type", contentType]);
  }

  const params: PresignedPostOptions = {
    Bucket: config.bucket,
    Key: path,
    Conditions: conditions,
    Fields: contentType
      ? {
          "Content-Type": contentType,
        }
      : {},
    Expires: 3600,
  };

  const result = await createPresignedPost(s3, params);

  return result;
};

export default createS3UploadFields;
