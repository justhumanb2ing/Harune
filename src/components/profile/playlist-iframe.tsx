import type { CSSProperties } from "react";
import { parsePlaylistIframe } from "@/lib/profile/playlist";

type PlaylistIframeProps = {
  content: string;
  title: string;
};

const defaultIframeStyle: CSSProperties = {
  border: 0,
  height: "400px",
  width: "100%",
};

export function PlaylistIframe({ content, title }: PlaylistIframeProps) {
  const iframe = parsePlaylistIframe(content);

  if (!iframe) {
    return null;
  }

  return (
    <iframe
      src={iframe.src}
      title={iframe.title || title}
      allow={iframe.allow}
      allowFullScreen={iframe.allowFullScreen}
      loading={iframe.loading ?? "lazy"}
      referrerPolicy={iframe.referrerPolicy}
      sandbox={iframe.sandbox}
      style={{ ...defaultIframeStyle, ...iframe.style }}
      className="block w-full rounded-none"
    />
  );
}
