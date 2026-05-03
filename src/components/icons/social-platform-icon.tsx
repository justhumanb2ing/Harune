import type { ReactNode } from "react";
import { FaLinkedinIn, FaYoutube } from "react-icons/fa6";
import { AppleMusicIcon } from "@/components/icons/apple-music-icon";
import {
  ColorAppleMusicIcon,
  ColorBehanceIcon,
  ColorGithubIcon,
  ColorInstagramIcon,
  ColorLinkedInIcon,
  ColorMailIcon,
  ColorSoundcloudIcon,
  ColorSpotifyIcon,
  ColorThreadsIcon,
  ColorTiktokIcon,
  ColorXTwitterIcon,
  ColorYoutubeIcon,
} from "@/components/icons/colored-social-icons";
import { GithubIcon } from "@/components/icons/github-icon";
import { InstagramIcon } from "@/components/icons/instagram-icon";
import { LogoBehanceIcon } from "@/components/icons/logo-behance-icon";
import { LogoThreadsIcon } from "@/components/icons/logo-threads-icon";
import { MailIcon } from "@/components/icons/mail-icon";
import type { IconProps } from "@/components/icons/social-icon-shared";
import { SoundcloudLogoSolidIcon } from "@/components/icons/soundcloud-logo-solid-icon";
import { SpotifyIcon } from "@/components/icons/spotify-icon";
import { TiktokIcon } from "@/components/icons/tiktok-icon";
import { XTwitterIcon } from "@/components/icons/x-twitter-icon";
import type { SocialPlatform } from "@/lib/profile/types";

type SocialIconComponent = (props: IconProps) => ReactNode;

function YoutubeIcon(props: IconProps) {
  return <FaYoutube {...props} />;
}

function LinkedInIcon(props: IconProps) {
  return <FaLinkedinIn {...props} />;
}

export const socialPlatformLabels: Record<SocialPlatform, string> = {
  x: "X",
  instagram: "Instagram",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  github: "GitHub",
  threads: "Threads",
  soundcloud: "SoundCloud",
  spotify: "Spotify",
  behance: "Behance",
  tiktok: "TikTok",
  mail: "Email",
  apple_music: "Apple Music",
};

export const socialPlatformIcons: Record<SocialPlatform, SocialIconComponent> = {
  x: XTwitterIcon,
  instagram: InstagramIcon,
  youtube: YoutubeIcon,
  linkedin: LinkedInIcon,
  github: GithubIcon,
  threads: LogoThreadsIcon,
  soundcloud: SoundcloudLogoSolidIcon,
  spotify: SpotifyIcon,
  behance: LogoBehanceIcon,
  tiktok: TiktokIcon,
  mail: MailIcon,
  apple_music: AppleMusicIcon,
};

export const socialPlatformColorIcons: Record<SocialPlatform, SocialIconComponent> = {
  x: ColorXTwitterIcon,
  instagram: ColorInstagramIcon,
  youtube: ColorYoutubeIcon,
  linkedin: ColorLinkedInIcon,
  github: ColorGithubIcon,
  threads: ColorThreadsIcon,
  soundcloud: ColorSoundcloudIcon,
  spotify: ColorSpotifyIcon,
  behance: ColorBehanceIcon,
  tiktok: ColorTiktokIcon,
  mail: ColorMailIcon,
  apple_music: ColorAppleMusicIcon,
};

type SocialPlatformIconProps = IconProps & {
  platform: SocialPlatform;
  variant?: "color" | "mono";
};

export function SocialPlatformIcon({
  platform,
  variant = "mono",
  ...props
}: SocialPlatformIconProps) {
  const Icon =
    variant === "color" ? socialPlatformColorIcons[platform] : socialPlatformIcons[platform];

  if (!Icon) {
    return null;
  }

  return <Icon {...props} />;
}
