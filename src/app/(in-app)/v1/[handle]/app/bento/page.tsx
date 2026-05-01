import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ProfileBentoEditor } from "@/components/profile-page/v2/profile-bento-editor";
import { ProfileLayoutTransition } from "@/components/transition/profile-layout-transition";
import { getProfileAppPath } from "@/lib/profile-page/app-paths";
import {
  getOwnedProfilePage,
  getOwnedProfilePageByHandle,
  getPublicProfileBentoPage,
} from "@/lib/profile-page/queries";

type BentoEditorPageProps = {
  params: Promise<{
    handle: string;
  }>;
};

export default async function BentoEditorPage({ params }: BentoEditorPageProps) {
  const [{ handle }, session] = await Promise.all([params, auth()]);

  if (!session?.user.id) {
    redirect("/sign-in");
  }

  const profilePage = await getOwnedProfilePageByHandle(session.user.id, handle);

  if (!profilePage?.handle) {
    const ownedProfilePage = await getOwnedProfilePage(session.user.id);

    if (ownedProfilePage?.handle) {
      redirect(getProfileAppPath(ownedProfilePage.handle, "/bento"));
    }

    redirect("/create");
  }

  const data = await getPublicProfileBentoPage(profilePage.handle);

  if (!data) {
    redirect(getProfileAppPath(profilePage.handle));
  }

  return (
    <ProfileLayoutTransition id="/app/bento">
      <ProfileBentoEditor initialData={data} />
    </ProfileLayoutTransition>
  );
}
