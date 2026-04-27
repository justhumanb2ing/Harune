import {
  createProfileSocialImage,
  socialImageSize,
} from "@/app/(public-profile)/[handle]/_social-image";
import { appConfig } from "@/lib/config";
import { getPublicProfilePageSocialImage } from "@/lib/profile-page/queries";

export const alt = `${appConfig.projectName} profile page`;
export const size = socialImageSize;
export const contentType = "image/png";

type ProfileImageProps = {
  params: Promise<{
    handle: string;
  }>;
};

export default async function Image({ params }: ProfileImageProps) {
  const { handle } = await params;
  const profile = await getPublicProfilePageSocialImage(handle);

  return createProfileSocialImage(profile);
}
