import { ImageResponse } from "next/og";
import { ApiError } from "@/lib/api/error";
import { getProfileByHandle } from "@/lib/api/generated/http/profile-api/profile-api";
import { absoluteUrl } from "@/lib/seo";

export const runtime = "edge";
export const dynamic = "force-dynamic";
export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

type HandleIconProps = {
  params: Promise<{
    handle: string;
  }>;
};

const resolveImageUrl = (image: string | null) => {
  if (!image) return null;

  try {
    return new URL(image).toString();
  } catch {
    return absoluteUrl(image.startsWith("/") ? image : `/${image}`);
  }
};

const getProfileIconPage = async (handle: string) => {
  try {
    const response = await getProfileByHandle(handle, {
      cache: "no-store",
    });

    if (response.status !== 200) {
      return null;
    }

    return response.data.page;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null;
    }

    throw error;
  }
};

export default async function Icon({ params }: HandleIconProps) {
  const { handle } = await params;
  const page = await getProfileIconPage(handle);
  const imageUrl = resolveImageUrl(page?.image ?? null);
  const fallbackInitial = (page?.name || handle || "H").trim().charAt(0).toUpperCase() || "H";

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        borderRadius: 8,
        background: "#ffffff",
      }}
    >
      {imageUrl ? (
        // biome-ignore lint/performance/noImgElement: next/og renders standard img elements in the generated image
        <img
          src={imageUrl}
          alt=""
          width={32}
          height={32}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      ) : (
        <span
          style={{
            color: "#1d1c1c",
            fontSize: 18,
            fontWeight: 800,
            lineHeight: 1,
          }}
        >
          {fallbackInitial}
        </span>
      )}
    </div>,
    size
  );
}
