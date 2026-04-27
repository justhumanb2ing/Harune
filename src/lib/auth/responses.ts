import { NextResponse } from "next/server";

export function createUnauthorizedResponse() {
  return NextResponse.json(
    {
      error: "Unauthorized",
      message: "You are not authorized to perform this action",
    },
    { status: 401 }
  );
}
