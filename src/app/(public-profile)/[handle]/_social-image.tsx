import { ImageResponse } from "next/og";
import { appConfig } from "@/lib/config";
import { absoluteUrl } from "@/lib/seo";

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
  const logoUrl = absoluteUrl("/assets/logo.png");

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#ffffff",
        color: "#1d1c1c",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        padding: "64px",
        fontFamily: "Inter, Arial, sans-serif",
      }}
    >
      {/* biome-ignore lint/performance/noImgElement: next/og renders standard img elements in the generated image */}
      <img
        src={logoUrl}
        alt=""
        width={120}
        height={120}
        style={{
          position: "absolute",
          top: 32,
          left: 32,
        }}
      />

      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "48px",
            maxWidth: 790,
          }}
        >
          <div
            style={{
              width: 240,
              height: 240,
              background: "#ffffff",
              borderRadius: 999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            {imageUrl ? (
              <>
                {/* biome-ignore lint/performance/noImgElement: next/og renders standard img elements in the generated image */}
                <img
                  src={imageUrl}
                  width={240}
                  height={240}
                  alt=""
                  style={{ objectFit: "cover", borderRadius: 999 }}
                />
              </>
            ) : (
              <span style={{ fontSize: 112, fontWeight: 900 }}>{avatarInitial}</span>
            )}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "18px",
            }}
          >
            <div style={{ fontSize: 64, fontWeight: 900, lineHeight: 0.95 }}>{displayName}</div>
            <div
              style={{
                paddingLeft: 6,
                fontSize: 26,
                lineHeight: 1.25,
                color: "#2f2d29",
              }}
            >
              {description}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 20,
          color: "#5b574f",
          position: "absolute",
          left: 64,
          right: 64,
          bottom: 64,
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
