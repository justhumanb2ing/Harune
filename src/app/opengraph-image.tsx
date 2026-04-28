import { ImageResponse } from "next/og";
import { seoConfig } from "@/lib/seo";

// Image metadata
export const alt = `${seoConfig.siteName} opengraph image`;
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

// Image generation
export default async function Image() {
  return new ImageResponse(
    // ImageResponse JSX element
    <div
      style={{
        background: "white",
        display: "flex",
        alignItems: "center",
        color: "#171717",
        height: "100%",
        justifyContent: "center",
        overflow: "hidden",
        position: "relative",
        width: "100%",
      }}
    >
      <div
        style={{
          alignItems: "center",
          display: "flex",
          flexDirection: "column",
          gap: 34,
          position: "relative",
          zIndex: 2,
        }}
      >
        <div
          style={{
            background: "#ffffff",
            borderRadius: 24,
            boxShadow: "0 18px 42px rgba(15, 23, 42, 0.16)",
            display: "flex",
            padding: 8,
            transform: "rotate(-6deg)",
          }}
        >
          <div
            style={{
              background: "#818cf8",
              borderRadius: 16,
              color: "#ffffff",
              display: "flex",
              fontSize: 58,
              fontWeight: 900,
              lineHeight: 1,
              padding: "18px 34px",
            }}
          >
            {seoConfig.siteName}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 116,
            fontWeight: 900,
            lineHeight: 1,
          }}
        >
          A Link in Bio
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 32,
            fontWeight: 500,
            gap: 4,
            textAlign: "center",
            alignItems: "center",
          }}
        >
          <p style={{ margin: 0, fontWeight: 500 }}>One page, all of you.</p>
          <p style={{ margin: 0 }}>Share everything you do, all in one place</p>
          <p style={{ margin: 0 }}>— create a page that shows who you are.</p>
        </div>
      </div>
    </div>,
    // ImageResponse options
    {
      // For convenience, we can re-use the exported opengraph-image
      // size config to also set the ImageResponse's width and height.
      ...size,
    }
  );
}
