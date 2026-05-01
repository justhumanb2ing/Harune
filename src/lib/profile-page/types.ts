import type { PlaylistProvider } from "@/lib/profile-page/playlist";

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
  linkBlockPosition: number;
  location: string | null;
  name: string | null;
  role: string | null;
  bio: string | null;
  image: string | null;
  backgroundImage: string | null;
};

export type SocialLink = {
  id: string;
  platform: SocialPlatform;
  url: string;
  position: number;
};

export type LinkItem = {
  id: string;
  title: string;
  description: string | null;
  favicon: string | null;
  url: string;
  position: number;
};

export type PlaylistItem = {
  id: string;
  title: string;
  provider: PlaylistProvider;
  content: string;
  position: number;
  blockPosition: number;
};

export type TextBoxItem = {
  id: string;
  title: string;
  description: string | null;
  position: number;
  blockPosition: number;
};

export type ProfilePageData = {
  page: ProfilePage;
  socialLinks: SocialLink[];
  linkItems: LinkItem[];
  playlistItems: PlaylistItem[];
  textBoxItems: TextBoxItem[];
};

export type ProfileBentoType = "link" | "text" | "playlist" | "section";

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
    thumbnail: string | null;
    url: string;
  };
};

export type ProfileTextBento = {
  id: string;
  type: "text";
  layout: ProfileBentoLayouts;
  content: {
    content: string;
  };
};

export type ProfilePlaylistBento = {
  id: string;
  type: "playlist";
  layout: ProfileBentoLayouts;
  content: {
    title: string;
    provider: PlaylistProvider;
    url: string;
    content: string;
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

export type ProfileBentoItem =
  | ProfileLinkBento
  | ProfileTextBento
  | ProfilePlaylistBento
  | ProfileSectionBento;

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
  linkBlockPosition: number;
  location: string;
  name: string;
  role: string;
  bio: string;
  image: string | null;
  backgroundImage: string | null;
};

export type DraftSocialLink = {
  platform: SocialPlatform;
  url: string;
  position: number;
};

export type DraftLinkItem = {
  id: string;
  title: string;
  description: string;
  favicon: string;
  url: string;
  position: number;
};

export type DraftPlaylistItem = {
  id: string;
  title: string;
  provider: PlaylistProvider;
  content: string;
  position: number;
  blockPosition: number;
};

export type DraftTextBoxItem = {
  id: string;
  title: string;
  description: string;
  position: number;
  blockPosition: number;
};

export type ProfilePageDraftData = {
  page: DraftProfilePage;
  socialLinks: DraftSocialLink[];
  linkItems: DraftLinkItem[];
  playlistItems: DraftPlaylistItem[];
  textBoxItems: DraftTextBoxItem[];
};

export type ProfilePageSyncPayload = {
  page: {
    handle: string;
    linkBlockPosition: number;
    location: string;
    name: string;
    role: string;
    bio: string;
    image: string | null;
    backgroundImage: string | null;
  };
  socialLinks: Array<{
    platform: SocialPlatform;
    position: number;
    url: string;
  }>;
  linkItems: Array<{
    id: string;
    title: string;
    description: string;
    favicon: string;
    position: number;
    url: string;
  }>;
  playlistItems: Array<{
    id: string;
    title: string;
    provider: PlaylistProvider;
    content: string;
    position: number;
    blockPosition: number;
  }>;
  textBoxItems: Array<{
    id: string;
    title: string;
    description: string;
    position: number;
    blockPosition: number;
  }>;
};
