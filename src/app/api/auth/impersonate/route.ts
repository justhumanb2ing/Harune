import { clearImpersonationCookie, setImpersonationCookie } from "@/auth";
import { env } from "@/env";
import { NextResponse } from "next/server";

const getSafeRedirectUrl = (value: string | undefined) => {
  const fallback = "/section";

  if (!value) {
    return fallback;
  }

  try {
    const baseUrl = env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const target = new URL(value, baseUrl);
    const base = new URL(baseUrl);

    if (target.origin !== base.origin) {
      return fallback;
    }

    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return fallback;
  }
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      signedToken?: string;
      callbackUrl?: string;
    };

    if (!body.signedToken) {
      return NextResponse.json({ error: "signedToken is required" }, { status: 400 });
    }

    await setImpersonationCookie(body.signedToken);

    return NextResponse.json({
      success: true,
      url: getSafeRedirectUrl(body.callbackUrl),
    });
  } catch (error) {
    console.error("Error setting impersonation session:", error);
    return NextResponse.json({ error: "Failed to impersonate user" }, { status: 400 });
  }
}

export async function DELETE() {
  await clearImpersonationCookie();
  return NextResponse.json({ success: true });
}
