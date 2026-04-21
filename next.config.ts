import { withSentry } from "@/lib/sentry/init";
import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";
import { env } from "./src/env";

const s3Host =
  env.AWS_BUCKET_NAME && env.AWS_REGION
    ? `${env.AWS_BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com`
    : null;

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
        hostname: "startup-template-sage.vercel.app",
      },
      ...(s3Host
        ? [
            {
              protocol: "https" as const,
              hostname: s3Host,
            },
          ]
        : []),
    ],
  },
  async rewrites() {
    return [
      {
        source: "/docs/:path*.mdx",
        destination: "/llms.mdx/:path*",
      },
    ];
  },
  experimental: {
    authInterrupts: true,
  },
  turbopack: {
    root: process.cwd(),
  },
};

const withMDX = createMDX();

export default withSentry(withMDX(nextConfig));
