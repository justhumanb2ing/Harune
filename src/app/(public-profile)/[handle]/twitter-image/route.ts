import { createProfileOpenGraphImage } from "@/app/(public-profile)/[handle]/_opengraph-image";
import { ApiError } from "@/lib/api/error";
import { getProfileByHandle } from "@/lib/api/generated/http/profile-api/profile-api";

type ProfileImageRouteContext = {
  params: Promise<{
    handle: string;
  }>;
};

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: ProfileImageRouteContext) {
  const { handle } = await params;

  try {
    const response = await getProfileByHandle(handle, {
      cache: "no-store",
    });

    if (response.status === 200) {
      return await createProfileOpenGraphImage({
        handle: response.data.page.handle,
        image: response.data.page.image,
        name: response.data.page.name,
      });
    }
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 404)) {
      throw error;
    }
  }

  return await createProfileOpenGraphImage({
    handle,
    image: null,
    name: null,
  });
}
