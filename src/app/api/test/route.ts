import { NextResponse } from "next/server";
import { fetchUrlMetadata } from "@/lib/metadata/url-metadata";

export const dynamic = "force-dynamic";

const noStoreHeaders = {
  "Cache-Control": "no-store",
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing URL." }, { headers: noStoreHeaders, status: 400 });
  }

  try {
    const metadata = await fetchUrlMetadata(url);

    return NextResponse.json(metadata, { headers: noStoreHeaders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch metadata.";
    const status = message.includes("Invalid URL") || message.includes("Only HTTP") ? 400 : 502;

    return NextResponse.json({ error: message }, { headers: noStoreHeaders, status });
  }
}
