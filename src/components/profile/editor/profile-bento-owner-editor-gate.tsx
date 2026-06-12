"use client";

import dynamic from "next/dynamic";
import type { getProfileByHandle } from "@/lib/api/generated/http/profile-api/profile-api";
import type { GetMe200 } from "@/lib/api/generated/http/schemas/me-api";
import type { ProfileBentoItem, ProfilePageData } from "@/lib/profile/types";

const LazyProfileBentoOwnerEditorSurface = dynamic(
  () =>
    import("@/components/profile/editor/profile-bento-owner-editor-surface").then(
      (module) => module.ProfileBentoOwnerEditorSurface
    ),
  {
    loading: () => null,
  }
);

type ProfileBentoOwnerEditorGateProps = {
  bento: ProfileBentoItem[];
  disableAnalytics: boolean;
  editorData: ProfilePageData;
  initialProfileResponse: Awaited<ReturnType<typeof getProfileByHandle>> | null;
  initialUser: GetMe200 | null;
  ownerHandle: string;
};

export function ProfileBentoOwnerEditorGate(props: ProfileBentoOwnerEditorGateProps) {
  return <LazyProfileBentoOwnerEditorSurface {...props} />;
}
