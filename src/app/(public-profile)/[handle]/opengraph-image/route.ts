import { createProfileSocialImage } from "@/app/(public-profile)/[handle]/_social-image";
import { getPublicProfilePageSocialImage } from "@/lib/profile-page/queries";

type ProfileImageRouteContext = {
  params: Promise<{
    handle: string;
  }>;
};

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: ProfileImageRouteContext) {
  const { handle } = await params;
  const profile = await getPublicProfilePageSocialImage(handle);

  return createProfileSocialImage(profile);
}
