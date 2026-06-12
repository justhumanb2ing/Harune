import { appConfig } from "@/lib/config";
import { getProfileAppPath } from "@/lib/profile/app-paths";

export type ProfileBentoShareChannel =
  | "x"
  | "threads"
  | "facebook"
  | "linkedin"
  | "whatsapp"
  | "snapchat"
  | "email";

export type ProfileBentoShareIntentContext = {
  handle: string;
  name: string;
};

export const PROFILE_BENTO_SHARE_COPY = "Built a little space online. Take a look ↓";

function getProfileShareUrl(handle: string) {
  return `${appConfig.url}${getProfileAppPath(handle)}`;
}

function getShareText() {
  return PROFILE_BENTO_SHARE_COPY;
}

export function buildProfileBentoSharePayload(
  channel: ProfileBentoShareChannel,
  context: ProfileBentoShareIntentContext
) {
  const profileUrl = getProfileShareUrl(context.handle);
  const text = getShareText();
  const body = `${text}\n${profileUrl}`;

  switch (channel) {
    case "x":
      return {
        href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(profileUrl)}`,
        text,
      };
    case "facebook":
      return {
        href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`,
        text,
      };
    case "linkedin":
      return {
        href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`,
        text,
      };
    case "whatsapp":
      return {
        href: `https://api.whatsapp.com/send?text=${encodeURIComponent(body)}`,
        text: body,
      };
    case "snapchat":
      return {
        href: `https://www.snapchat.com/share?link=${encodeURIComponent(profileUrl)}`,
        text,
      };
    case "threads":
      return {
        href: `https://www.threads.com/intent/post?text=${encodeURIComponent(
          text
        )}&url=${encodeURIComponent(profileUrl)}`,
        text: body,
      };
    case "email":
      return {
        href: `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(body)}`,
        text: body,
      };
  }
}
