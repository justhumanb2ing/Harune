import type { NextConfig } from "next";
import { withSentry } from "@/lib/sentry/init";
import { env } from "./src/env";

const s3Host =
  (env.AWS_BUCKET_NAME || env.AWS_S3_BUCKET_NAME) && env.AWS_REGION
    ? `${env.AWS_BUCKET_NAME || env.AWS_S3_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com`
    : null;
const getSupabaseStorageHost = () => {
  if (!env.SUPABASE_S3_ENDPOINT) {
    return null;
  }

  try {
    return new URL(env.SUPABASE_S3_ENDPOINT).hostname;
  } catch {
    return null;
  }
};
const supabaseStorageHost = getSupabaseStorageHost();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
      {
        protocol: "https",
        hostname: "harune.me",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      ...(s3Host
        ? [
            {
              protocol: "https" as const,
              hostname: s3Host,
            },
          ]
        : []),
      ...(supabaseStorageHost
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseStorageHost,
            },
          ]
        : []),
    ],
  },
  experimental: {
    authInterrupts: true,
    viewTransition: true,
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default withSentry(nextConfig);
