import { auth } from "@/auth";
import { resolveAuthenticatedAppRedirect } from "@/lib/auth/app-redirect";
import { redirect } from "next/navigation";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-up");
  }

  redirect(await resolveAuthenticatedAppRedirect({ userId: session.user.id }));
}
