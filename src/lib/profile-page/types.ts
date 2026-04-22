export type SocialPlatform = "x" | "instagram" | "youtube" | "linkedin" | "github";

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
  page: {
    id: string;
    handle: string;
    name: string | null;
    bio: string | null;
    image: string | null;
  };
  socialLinks: SocialLink[];
  linkItems: LinkItem[];
  textBoxItems: TextBoxItem[];
};
