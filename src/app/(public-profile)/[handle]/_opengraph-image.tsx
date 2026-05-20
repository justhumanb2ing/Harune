import { ImageResponse } from "next/og";
import { absoluteUrl } from "@/lib/seo";

export const opengraphImageSize = {
  width: 1200,
  height: 630,
};

type OpenGraphProfile = {
  handle: string;
  image: string | null;
  name: string | null;
};

const resolveImageUrl = (image: string | null) => {
  if (!image) return null;

  try {
    return new URL(image).toString();
  } catch {
    return absoluteUrl(image.startsWith("/") ? image : `/${image}`);
  }
};

const getDisplayName = (profile: OpenGraphProfile | null) =>
  profile?.name || (profile?.handle ? `@${profile.handle}` : "");

export function createProfileOpenGraphImage(profile: OpenGraphProfile | null) {
  const displayName = getDisplayName(profile);
  const imageUrl = resolveImageUrl(profile?.image ?? null);
  const handleText = profile?.handle ? `harune.me/${profile.handle}` : "harune.me";

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#ffffff",
        color: "#111111",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Inter, Arial, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "36px",
        }}
      >
        <div
          style={{
            width: 240,
            height: 240,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            borderRadius: 9999,
            background: "#ffffff",
            flexShrink: 0,
          }}
        >
          {imageUrl ? (
            // biome-ignore lint/performance/noImgElement: next/og renders standard img elements in the generated image
            <img
              src={imageUrl}
              alt=""
              width={240}
              height={240}
              style={{
                objectFit: "cover",
                borderRadius: 9999,
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                background: "rgba(247, 247, 247, 0.7)",
              }}
            />
          )}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 900,
              lineHeight: 1,
              textAlign: "center",
              letterSpacing: "-0.04em",
              maxWidth: 980,
              wordBreak: "break-word",
            }}
          >
            {displayName}
          </div>

          <div
            style={{
              fontSize: 28,
              fontWeight: 600,
              lineHeight: 1,
              textAlign: "center",
              letterSpacing: "-0.02em",
              color: "#4a4a4a",
            }}
          >
            {handleText}
          </div>
        </div>
      </div>
    </div>,
    opengraphImageSize
  );
}
