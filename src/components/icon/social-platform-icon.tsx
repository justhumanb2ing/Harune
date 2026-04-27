import { AppleMusicIcon } from "@/components/icon/apple-music-icon";
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
} from "@/components/icon/colored-social-icons";
import { GithubIcon } from "@/components/icon/github-icon";
import { InstagramIcon } from "@/components/icon/instagram-icon";
import { LogoBehanceIcon } from "@/components/icon/logo-behance-icon";
import { LogoThreadsIcon } from "@/components/icon/logo-threads-icon";
import { MailIcon } from "@/components/icon/mail-icon";
import type { IconProps } from "@/components/icon/social-icon-shared";
import { SoundcloudLogoSolidIcon } from "@/components/icon/soundcloud-logo-solid-icon";
import { SpotifyIcon } from "@/components/icon/spotify-icon";
import { TiktokIcon } from "@/components/icon/tiktok-icon";
import { XTwitterIcon } from "@/components/icon/x-twitter-icon";
import type { SocialPlatform } from "@/lib/profile-page/types";
import type { ReactNode } from "react";
import { FaLinkedinIn, FaYoutube } from "react-icons/fa6";

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

  return <Icon {...props} />;
}
