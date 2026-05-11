import { describe, expect, test } from "bun:test";

import { parseServerMeResponse } from "@/lib/users/server-me-response";

describe("parseServerMeResponse", () => {
  test("returns null for unauthorized responses", async () => {
    const response = new Response(JSON.stringify({ error: "unauthorized" }), {
      headers: {
        "content-type": "application/json",
      },
      status: 401,
    });

    expect(await parseServerMeResponse(response)).toBe(null);
  });

  test("returns null for unexpected server errors", async () => {
    const response = new Response(JSON.stringify({ error: "internal_server_error" }), {
      headers: {
        "content-type": "application/json",
      },
      status: 500,
    });

    expect(await parseServerMeResponse(response)).toBe(null);
  });

  test("parses successful app context responses", async () => {
    const response = new Response(
      JSON.stringify({
        currentPlan: null,
        profilePage: null,
        user: {
          credits: {},
          createdAt: "2026-05-08T00:00:00.000Z",
          email: "demo@example.com",
          id: "user-1",
          image: null,
          name: "Demo",
          planId: null,
          updatedAt: "2026-05-08T00:00:00.000Z",
        },
      }),
      {
        headers: {
          "content-type": "application/json",
        },
        status: 200,
      }
    );

    expect(await parseServerMeResponse(response)).toEqual({
      currentPlan: null,
      profilePage: null,
      user: {
        credits: {},
        createdAt: "2026-05-08T00:00:00.000Z",
        email: "demo@example.com",
        id: "user-1",
        image: null,
        name: "Demo",
        planId: null,
        updatedAt: "2026-05-08T00:00:00.000Z",
      },
    });
  });
});
