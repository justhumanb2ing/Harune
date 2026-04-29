import { NextResponse } from "next/server";
import type { IframelyResponse } from "@/lib/profile-page/iframely";

export const dynamic = "force-dynamic";

const noStoreHeaders = {
  "Cache-Control": "no-store",
};

const iframelyBaseUrl = "https://iframe.bybu.cc/iframely";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json({ error: "Missing URL." }, { headers: noStoreHeaders, status: 400 });
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL." }, { headers: noStoreHeaders, status: 400 });
    }

    const upstreamUrl = `${iframelyBaseUrl}?${new URLSearchParams({ url }).toString()}`;
    const response = await fetch(upstreamUrl, {
      cache: "no-store",
    });

    const body = (await response.json()) as IframelyResponse;

    return NextResponse.json(body, {
      headers: noStoreHeaders,
      status: response.status,
    });
  } catch (error) {
    console.error("Failed to fetch playlist preview:", error);
    return NextResponse.json(
      { error: "Failed to fetch playlist." },
      { headers: noStoreHeaders, status: 500 }
    );
  }
}
