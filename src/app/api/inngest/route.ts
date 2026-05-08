import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const disabledInngestResponse = () =>
  NextResponse.json(
    {
      error: "Inngest backend is disabled.",
    },
    { status: 503 }
  );

export const GET = disabledInngestResponse;
export const POST = disabledInngestResponse;
export const PUT = disabledInngestResponse;
