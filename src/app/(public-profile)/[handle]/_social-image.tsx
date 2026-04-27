import { appConfig } from "@/lib/config";
import { absoluteUrl } from "@/lib/seo";
import { ImageResponse } from "next/og";

export const socialImageSize = {
  width: 1200,
  height: 630,
};

type ProfileSocialImageData = {
  bio: string | null;
  handle: string;
  image: string | null;
  name: string | null;
  role: string | null;
  userName: string | null;
};

const resolveImageUrl = (image: string | null) => {
  if (!image) return null;

  try {
    return new URL(image).toString();
  } catch {
    return absoluteUrl(image.startsWith("/") ? image : `/${image}`);
  }
};

const truncate = (value: string, maxLength: number) =>
  value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value;

export function createProfileSocialImage(profile: ProfileSocialImageData | null) {
  const displayName = truncate(
    profile?.name ||
      profile?.userName ||
      (profile?.handle ? `@${profile.handle}` : appConfig.projectName),
    34
  );
  const handle = profile?.handle ? `${profile.handle}` : appConfig.url.replace(/^https?:\/\//, "");
  const description = truncate(profile?.bio || profile?.role || appConfig.description, 120);
  const imageUrl = resolveImageUrl(profile?.image ?? null);
  const avatarInitial = displayName.trim().charAt(0).toUpperCase() || "H";

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#f8f6ef",
        color: "#1d1c1c",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px",
        fontFamily: "Inter, Arial, sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "42px" }}>
        <div
          style={{
            width: 190,
            height: 190,
            background: "#ffffff",
            border: "6px solid #1d1c1c",
            borderRadius: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              width={190}
              height={190}
              alt=""
              style={{ objectFit: "cover", borderRadius: 999 }}
            />
          ) : (
            <span style={{ fontSize: 92, fontWeight: 900 }}>{avatarInitial}</span>
          )}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            maxWidth: 790,
          }}
        >
          <div style={{ fontSize: 80, fontWeight: 900, lineHeight: 0.95 }}>{displayName}</div>
          <div
            style={{
              paddingLeft: 6,
              fontSize: 36,
              lineHeight: 1.25,
              color: "#2f2d29",
            }}
          >
            {description}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 28,
          color: "#5b574f",
        }}
      >
        <span>Everything you are, in one place.</span>
        <span>
          {appConfig.url.replace(/^https?:\/\//, "")}/{handle}
        </span>
      </div>
    </div>,
    socialImageSize
  );
}
