import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { seoConfig } from "@/lib/seo";

export const alt = `${seoConfig.siteName} opengraph image`;
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  const logoData = await readFile(join(process.cwd(), "public/assets/logo.png"), "base64");
  const logoSrc = `data:image/png;base64,${logoData}`;

  return new ImageResponse(
    <div
      style={{
        color: "#171717",
        display: "flex",
        alignItems: "center",
        background: "#ffffff",
        height: "100%",
        position: "relative",
        justifyContent: "center",
        width: "100%",
      }}
    >
      {/* biome-ignore lint/performance/noImgElement: next/og renders standard img elements in the generated image */}
      <img
        alt={seoConfig.siteName}
        src={logoSrc}
        width={420}
        height={420}
        style={{
          height: 420,
          objectFit: "contain",
          width: 420,
        }}
      />
      <div
        style={{
          bottom: 56,
          display: "flex",
          fontSize: 40,
          fontWeight: 700,
          left: 0,
          letterSpacing: "-0.03em",
          position: "absolute",
          right: 0,
          justifyContent: "center",
        }}
      >
        Harune, A Link in Bio
      </div>
    </div>,
    {
      ...size,
    }
  );
}
