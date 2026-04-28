import "server-only";

import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import s3 from "./client";
import { getS3ObjectKeyFromPublicUrl, getS3StorageConfig } from "./config";

export async function deletePublicS3Object(publicUrl: string) {
  const config = getS3StorageConfig();
  const objectKey = getS3ObjectKeyFromPublicUrl(publicUrl);

  if (!config.bucket || !objectKey) {
    return false;
  }

  await s3.send(
    new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: objectKey,
    })
  );

  return true;
}
