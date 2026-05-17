import type { NormalizedMetadata } from "@/lib/metadata/url-metadata";
export const MAX_SOCIAL_LINKS = 8;

export type SocialPlatform =
  | "x"
  | "instagram"
  | "youtube"
  | "linkedin"
  | "github"
  | "threads"
  | "soundcloud"
  | "spotify"
  | "behance"
  | "tiktok"
  | "mail"
  | "apple_music";

export type ProfilePage = {
  id: string;
  handle: string;
  location: string | null;
  name: string | null;
  role: string | null;
  bio: string | null;
  image: string | null;
  imageCrop: ProfileImageCrop | null;
  backgroundImage: string | null;
};

export type ProfilePageData = {
  page: ProfilePage;
};

export type ProfileBentoType = "link" | "text" | "section" | "media" | "map";
export type ProfileMediaType = "image" | "video";
export type ProfileTextAlign = "start" | "center" | "end";
export type ProfileVerticalAlign = "start" | "center" | "end";

export type ProfileTextSurfaceStyle = {
  backgroundColor: string;
  textAlign: ProfileTextAlign;
  verticalAlign: ProfileVerticalAlign;
};

export type ProfileBentoBreakpoint = "desktop" | "compact";

export type ProfileBentoLayout = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type ProfileBentoLayouts = Record<ProfileBentoBreakpoint, ProfileBentoLayout>;

export type ProfileLinkBento = {
  id: string;
  type: "link";
  layout: ProfileBentoLayouts;
  content: {
    title: string;
    description: string | null;
    favicon: string | null;
    domain: string;
    thumbnail: string | null;
    url: string;
    metadata?: NormalizedMetadata | null;
  };
};

export type ProfileTextBento = {
  id: string;
  type: "text";
  layout: ProfileBentoLayouts;
  content: {
    content: string;
    style: ProfileTextSurfaceStyle;
  };
};

export type ProfileSectionBento = {
  id: string;
  type: "section";
  layout: ProfileBentoLayouts;
  content: {
    title: string;
  };
};

export type ProfileMediaBento = {
  id: string;
  type: "media";
  layout: ProfileBentoLayouts;
  content: {
    mediaType: ProfileMediaType;
    url: string;
    objectKey: string;
    tempObjectKey?: string;
    contentHash?: string;
    contentType?: string;
    href: string | null;
    alt: string;
    caption: string;
  };
};

export type ProfileMapBento = {
  id: string;
  type: "map";
  layout: ProfileBentoLayouts;
  content: {
    latitude: number;
    longitude: number;
    zoom: number;
    caption: string;
    url: string;
  };
};

export type ProfileBentoItem =
  | ProfileLinkBento
  | ProfileTextBento
  | ProfileSectionBento
  | ProfileMediaBento
  | ProfileMapBento;

export type ProfileBentoApiItem = Omit<ProfileBentoItem, "layout"> & {
  position: ProfileBentoLayouts;
};

export type ProfilePageEditorApiData = ProfilePage & {
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  bento: {
    items: ProfileBentoApiItem[];
  };
};

export type PublicProfileBentoPageData = {
  page: ProfilePage & {
    updatedAt: Date;
    userName: string | null;
  };
  bento: ProfileBentoItem[];
};

export type DraftProfilePage = {
  id: string;
  handle: string;
  location: string;
  name: string;
  role: string;
  bio: string;
  image: string | null;
  imageCrop: ProfileImageCrop | null;
  backgroundImage: string | null;
};

export type ProfilePageDraftData = {
  page: DraftProfilePage;
};

export type ProfilePageSyncPayload = {
  page: {
    handle: string;
    location: string;
    name: string;
    role: string;
    bio: string;
    image: string | null;
    imageCrop: ProfileImageCrop | null;
    backgroundImage: string | null;
  };
};

export type ProfileImageCrop = {
  croppedAreaPixels: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};
