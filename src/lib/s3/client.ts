import { S3Client } from "@aws-sdk/client-s3";
import { getS3StorageConfig } from "./config";

const config = getS3StorageConfig();

const s3 = new S3Client({
  credentials:
    config.accessKeyId && config.secretAccessKey
      ? {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        }
      : undefined,
  endpoint: config.endpoint,
  forcePathStyle: config.forcePathStyle,
  region: config.region,
});

export default s3;
