import { auth } from "@/auth";
import { resolveAuthenticatedAppRedirect } from "@/lib/auth/app-redirect";
import { redirect } from "next/navigation";

type PostSignInPageProps = {
  searchParams: Promise<{
    handle?: string;
    next?: string;
  }>;
};

export default async function PostSignInPage({ searchParams }: PostSignInPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const { handle, next } = await searchParams;
  redirect(await resolveAuthenticatedAppRedirect({ handle, next, userId: session.user.id }));
}
