export type SocialPlatform = "x" | "instagram" | "youtube" | "linkedin" | "github";

export type ProfilePage = {
  id: string;
  handle: string;
  name: string | null;
  bio: string | null;
  image: string | null;
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

export type TextBoxItem = {
  id: string;
  title: string;
  description: string | null;
  position: number;
};

export type ProfilePageData = {
  page: ProfilePage;
  socialLinks: SocialLink[];
  linkItems: LinkItem[];
  textBoxItems: TextBoxItem[];
};

export type DraftProfilePage = {
  id: string;
  handle: string;
  name: string;
  bio: string;
  image: string | null;
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

export type DraftTextBoxItem = {
  id: string;
  title: string;
  description: string;
  position: number;
};

export type ProfilePageDraftData = {
  page: DraftProfilePage;
  socialLinks: DraftSocialLink[];
  linkItems: DraftLinkItem[];
  textBoxItems: DraftTextBoxItem[];
};

export type ProfilePageSyncPayload = {
  page: {
    handle: string;
    name: string;
    bio: string;
    image: string | null;
  };
  socialLinks: Array<{
    platform: SocialPlatform;
    url: string;
  }>;
  linkItems: Array<{
    id: string;
    title: string;
    description: string;
    favicon: string;
    url: string;
  }>;
  textBoxItems: Array<{
    id: string;
    title: string;
    description: string;
  }>;
};
