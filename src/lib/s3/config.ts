import { env } from "@/env";

type StorageProvider = "aws" | "supabase";

type S3StorageConfig = {
  accessKeyId?: string;
  bucket?: string;
  endpoint?: string;
  forcePathStyle?: boolean;
  provider: StorageProvider;
  region?: string;
  secretAccessKey?: string;
};

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const encodeKey = (key: string) => key.split("/").map(encodeURIComponent).join("/");

export function getS3StorageConfig(): S3StorageConfig {
  const hasSupabaseS3Config = Boolean(
    env.SUPABASE_S3_ENDPOINT ||
      env.SUPABASE_S3_ACCESS_KEY_ID ||
      env.SUPABASE_S3_SECRET_ACCESS_KEY ||
      env.SUPABASE_S3_REGION ||
      env.SUPABASE_S3_BUCKET ||
      env.SUPABASE_S3_BUCKET_NAME
  );

  if (hasSupabaseS3Config) {
    return {
      accessKeyId: env.SUPABASE_S3_ACCESS_KEY_ID,
      bucket:
        env.SUPABASE_S3_BUCKET ||
        env.SUPABASE_S3_BUCKET_NAME ||
        env.AWS_BUCKET_NAME ||
        env.AWS_S3_BUCKET_NAME,
      endpoint: env.SUPABASE_S3_ENDPOINT ? trimTrailingSlash(env.SUPABASE_S3_ENDPOINT) : undefined,
      forcePathStyle: true,
      provider: "supabase",
      region: env.SUPABASE_S3_REGION || env.AWS_REGION,
      secretAccessKey: env.SUPABASE_S3_SECRET_ACCESS_KEY,
    };
  }

  return {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    bucket: env.AWS_BUCKET_NAME || env.AWS_S3_BUCKET_NAME,
    provider: "aws",
    region: env.AWS_REGION,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  };
}

export function getMissingS3ConfigKeys() {
  const config = getS3StorageConfig();
  const missingKeys: string[] = [];

  if (!config.bucket) {
    missingKeys.push(config.provider === "supabase" ? "SUPABASE_S3_BUCKET" : "AWS_BUCKET_NAME");
  }

  if (!config.region) {
    missingKeys.push(config.provider === "supabase" ? "SUPABASE_S3_REGION" : "AWS_REGION");
  }

  if (!config.accessKeyId) {
    missingKeys.push(
      config.provider === "supabase" ? "SUPABASE_S3_ACCESS_KEY_ID" : "AWS_ACCESS_KEY_ID"
    );
  }

  if (!config.secretAccessKey) {
    missingKeys.push(
      config.provider === "supabase" ? "SUPABASE_S3_SECRET_ACCESS_KEY" : "AWS_SECRET_ACCESS_KEY"
    );
  }

  if (config.provider === "supabase" && !config.endpoint) {
    missingKeys.push("SUPABASE_S3_ENDPOINT");
  }

  return missingKeys;
}

export function getPublicS3ObjectUrl(key: string) {
  const config = getS3StorageConfig();

  if (!config.bucket) {
    throw new Error("S3 bucket is not configured");
  }

  const encodedKey = encodeKey(key);

  if (config.provider === "supabase") {
    if (!config.endpoint) {
      throw new Error("SUPABASE_S3_ENDPOINT is not configured");
    }

    const endpointUrl = new URL(config.endpoint);
    return `${endpointUrl.origin}/storage/v1/object/public/${config.bucket}/${encodedKey}`;
  }

  if (!config.region) {
    throw new Error("AWS_REGION is not configured");
  }

  return `https://${config.bucket}.s3.${config.region}.amazonaws.com/${encodedKey}`;
}

export function getS3ObjectKeyFromPublicUrl(publicUrl: string) {
  const config = getS3StorageConfig();

  if (!config.bucket) {
    return null;
  }

  try {
    const url = new URL(publicUrl);

    if (config.provider === "supabase") {
      if (!config.endpoint) {
        return null;
      }

      const endpointUrl = new URL(config.endpoint);
      const publicPrefix = `/storage/v1/object/public/${config.bucket}/`;

      if (url.origin !== endpointUrl.origin || !url.pathname.startsWith(publicPrefix)) {
        return null;
      }

      return decodeURIComponent(url.pathname.slice(publicPrefix.length));
    }

    if (!config.region) {
      return null;
    }

    const expectedHost = `${config.bucket}.s3.${config.region}.amazonaws.com`;

    if (url.hostname !== expectedHost) {
      return null;
    }

    return decodeURIComponent(url.pathname.replace(/^\/+/, ""));
  } catch {
    return null;
  }
}
