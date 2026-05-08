import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json({ error: "Paddle webhooks are disabled." }, { status: 503 });
}
