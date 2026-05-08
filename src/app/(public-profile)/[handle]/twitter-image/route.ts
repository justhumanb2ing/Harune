import { createProfileSocialImage } from "@/app/(public-profile)/[handle]/_social-image";

type ProfileImageRouteContext = {
  params: Promise<{
    handle: string;
  }>;
};

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: ProfileImageRouteContext) {
  void params;
  return createProfileSocialImage(null);
}
