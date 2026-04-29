import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { resolveAuthenticatedAppRedirect } from "@/lib/auth/app-redirect";
import { getSafeRedirectPath } from "@/lib/auth/app-redirect-paths";

export async function GET(request: NextRequest) {
  const session = await auth();
  const { searchParams } = request.nextUrl;

  if (!session?.user?.id) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set(
      "callbackUrl",
      getSafeRedirectPath(`${request.nextUrl.pathname}${request.nextUrl.search}`)
    );

    redirect(signInUrl.pathname + signInUrl.search);
  }

  redirect(
    await resolveAuthenticatedAppRedirect({
      handle: searchParams.get("handle") ?? undefined,
      next: searchParams.get("next") ?? undefined,
      userId: session.user.id,
    })
  );
}
