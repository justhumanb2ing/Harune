import type { GetProfileByHandle200 } from "@/lib/api/generated/http/schemas/profile-api";
import type { ProfilePageData } from "@/lib/profile/types";

export const toProfilePageEditorDataFromPublicPage = (
  page: Omit<GetProfileByHandle200["page"], 'updatedAt'> & { updatedAt: Date; }
): ProfilePageData => ({
  page: {
    id: page.id,
    handle: page.handle,
    location: page.location,
    name: page.name,
    role: page.role,
    bio: page.bio,
    image: page.image,
    backgroundImage: page.backgroundImage,
  },
});
