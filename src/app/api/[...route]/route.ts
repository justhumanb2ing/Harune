import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const disabledApiResponse = () =>
  NextResponse.json(
    {
      error: "Backend API is disabled.",
    },
    { status: 503 }
  );

export const DELETE = disabledApiResponse;
export const GET = disabledApiResponse;
export const PATCH = disabledApiResponse;
export const POST = disabledApiResponse;
