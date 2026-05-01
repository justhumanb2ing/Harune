import "server-only";

import { createHash } from "node:crypto";
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { env } from "@/env";
import type { ProfileMediaType } from "@/lib/profile-page/types";

type R2Config = {
  accessKeyId: string;
  bucket: string;
  endpoint: string;
  publicBaseUrl: string;
  secretAccessKey: string;
};

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");
const encodeKey = (key: string) => key.split("/").map(encodeURIComponent).join("/");
const safeSegment = (value: string) => encodeURIComponent(value.trim());

const getR2Config = (): R2Config => {
  const endpoint = env.R2_ACCOUNT_ID
    ? `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
    : undefined;

  if (
    !env.R2_ACCESS_KEY_ID ||
    !env.R2_SECRET_ACCESS_KEY ||
    !env.R2_BUCKET_NAME ||
    !endpoint ||
    !env.R2_PUBLIC_BASE_URL
  ) {
    throw new Error(
      "R2 storage is not configured: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_BASE_URL"
    );
  }

  return {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    bucket: env.R2_BUCKET_NAME,
    endpoint,
    publicBaseUrl: trimTrailingSlash(env.R2_PUBLIC_BASE_URL),
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  };
};

const getR2Client = () => {
  const config = getR2Config();

  return new S3Client({
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    endpoint: config.endpoint,
    forcePathStyle: true,
    region: "auto",
  });
};

export const getProfileBentoMediaObjectKey = ({
  bentoId,
  userId,
}: {
  bentoId: string;
  userId: string;
}) => `public/users/${safeSegment(userId)}/profile-page/bento/${safeSegment(bentoId)}/media`;

export const getTemporaryProfileBentoMediaObjectKey = ({
  bentoId,
  userId,
}: {
  bentoId: string;
  userId: string;
}) =>
  `tmp/users/${safeSegment(userId)}/profile-page/bento/${safeSegment(bentoId)}/${crypto.randomUUID()}`;

export const getProfileBentoMediaPublicUrl = ({
  contentHash,
  objectKey,
}: {
  contentHash: string;
  objectKey: string;
}) => {
  const config = getR2Config();
  const url = new URL(`${config.publicBaseUrl}/${encodeKey(objectKey)}`);
  url.searchParams.set("v", contentHash);

  return url.toString();
};

export const getProfileBentoMediaObjectKeyFromUrl = (publicUrl: string) => {
  const config = getR2Config();

  try {
    const url = new URL(publicUrl);
    const baseUrl = new URL(config.publicBaseUrl);

    if (url.origin !== baseUrl.origin) {
      return null;
    }

    const basePath = baseUrl.pathname.replace(/\/+$/, "");
    const keyPath = url.pathname.slice(basePath.length).replace(/^\/+/, "");

    return keyPath ? decodeURIComponent(keyPath) : null;
  } catch {
    return null;
  }
};

export const isProfileBentoMediaObjectKeyForBento = ({
  bentoId,
  objectKey,
  userId,
}: {
  bentoId: string;
  objectKey: string;
  userId: string;
}) => {
  const finalKey = getProfileBentoMediaObjectKey({ bentoId, userId });
  const temporaryPrefix = `tmp/users/${safeSegment(userId)}/profile-page/bento/${safeSegment(bentoId)}/`;

  return objectKey === finalKey || objectKey.startsWith(temporaryPrefix);
};

export const hashProfileBentoMediaBuffer = (buffer: Buffer) =>
  createHash("sha256").update(buffer).digest("hex");

export const putTemporaryProfileBentoMediaObject = async ({
  body,
  contentType,
  objectKey,
}: {
  body: Buffer;
  contentType: string;
  objectKey: string;
}) => {
  const config = getR2Config();

  await getR2Client().send(
    new PutObjectCommand({
      Body: body,
      Bucket: config.bucket,
      CacheControl: "public, max-age=31536000, immutable",
      ContentType: contentType,
      Key: objectKey,
    })
  );
};

export const copyProfileBentoMediaObject = async ({
  contentHash,
  contentType,
  fromObjectKey,
  mediaType,
  toObjectKey,
}: {
  contentHash: string;
  contentType: string;
  fromObjectKey: string;
  mediaType: ProfileMediaType;
  toObjectKey: string;
}) => {
  const config = getR2Config();

  await getR2Client().send(
    new CopyObjectCommand({
      Bucket: config.bucket,
      CacheControl: "public, max-age=31536000, immutable",
      ContentType: contentType,
      CopySource: `${config.bucket}/${encodeKey(fromObjectKey)}`,
      Key: toObjectKey,
      Metadata: {
        contentHash,
        mediaType,
      },
      MetadataDirective: "REPLACE",
    })
  );
};

export const deleteProfileBentoMediaObject = async (objectKey: string) => {
  const config = getR2Config();

  await getR2Client().send(
    new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: objectKey,
    })
  );
};
