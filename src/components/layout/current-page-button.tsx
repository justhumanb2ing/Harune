"use client";

import { useOptionalProfilePageEditorStore } from "@/components/section/profile-page/profile-page-editor-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { appConfig } from "@/lib/config";
import useUser from "@/lib/users/useUser";
import { usePathname } from "next/navigation";

function getRouteLabel(pathname: string) {
  const segment = pathname.split("/").filter(Boolean)[0] ?? "page";

  return segment
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getPathLabel(pathname: string) {
  const host = appConfig.url.replace(/^https?:\/\//, "");
  const resolvedPath = pathname === "/" ? "" : pathname;

  return `${host}${resolvedPath}`;
}

export function useCurrentPageMeta() {
  const pathname = usePathname();
  const { profilePage } = useUser();
  const draftPage = useOptionalProfilePageEditorStore((state) => state.draftData?.page ?? null);
  const previewImageUrl = useOptionalProfilePageEditorStore((state) => state.previewImageUrl);

  const pageName = draftPage?.name?.trim() || profilePage?.name?.trim() || getRouteLabel(pathname);
  const resolvedHandle = draftPage?.handle || profilePage?.handle;
  const pageHandleLabel = resolvedHandle
    ? `${appConfig.url.replace(/^https?:\/\//, "")}/${resolvedHandle}`
    : getPathLabel(pathname);
  const pageImage = previewImageUrl || draftPage?.image || profilePage?.image || undefined;
  const pageInitial = pageName.charAt(0).toUpperCase() || "P";

  return {
    pageHandleLabel,
    pageImage,
    pageInitial,
    pageName,
  };
}

export function CurrentPageButton({
  className,
  size = "default",
}: {
  className?: string;
  size?: "default" | "sm" | "lg";
}) {
  const { pageImage, pageInitial, pageName } = useCurrentPageMeta();

  return (
    <Avatar className={className} size={size}>
      <AvatarImage src={pageImage} alt={pageName} />
      <AvatarFallback />
    </Avatar>
  );
}
