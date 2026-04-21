import { env } from "@/env";
import { S3Client } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: env.AWS_REGION,
});

export default s3;
