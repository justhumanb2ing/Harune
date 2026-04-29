"use client";

import { usePathname } from "next/navigation";
import { useOptionalProfilePageEditorStore } from "@/components/profile-page/layout/profile-page-editor-provider";
import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { appConfig } from "@/lib/config";
import useUser from "@/lib/users/use-user";

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
  const matchedProfilePage = profilePage ?? null;
  const currentPage = useOptionalProfilePageEditorStore((state) => state.baseData?.page ?? null);
  const draftPage = useOptionalProfilePageEditorStore((state) => state.draftData?.page ?? null);
  const previewImageUrl = useOptionalProfilePageEditorStore((state) => state.previewImageUrl);

  const pageName =
    draftPage?.name?.trim() ||
    currentPage?.name?.trim() ||
    matchedProfilePage?.name?.trim() ||
    getRouteLabel(pathname);
  const resolvedHandle = draftPage?.handle || currentPage?.handle || matchedProfilePage?.handle;
  const pageHandleLabel = resolvedHandle
    ? `${appConfig.url.replace(/^https?:\/\//, "")}/${resolvedHandle}`
    : getPathLabel(pathname);
  const pageImage =
    previewImageUrl ||
    draftPage?.image ||
    currentPage?.image ||
    matchedProfilePage?.image ||
    undefined;
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
  const { pageImage, pageName } = useCurrentPageMeta();

  return (
    <Avatar className={className} size={size}>
      <AvatarImage src={pageImage} alt={pageName} />
      <AvatarFallback />
      <AvatarBadge className="bg-green-400 dark:bg-green-800" />
    </Avatar>
  );
}
