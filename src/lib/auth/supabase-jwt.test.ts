import { describe, expect, test } from "bun:test";

import { betterAuthSupabaseJwtOptions } from "@/lib/auth/supabase-jwt";

const session = {
  user: {
    id: "user_123",
    email: "owner@example.com",
    emailVerified: true,
    name: "Owner",
    createdAt: new Date("2029-01-01T00:00:00.000Z"),
    updatedAt: new Date("2029-01-01T00:00:00.000Z"),
  },
  session: {
    id: "session_123",
    userId: "user_123",
    token: "token_123",
    expiresAt: new Date("2030-01-01T00:00:00.000Z"),
    createdAt: new Date("2029-01-01T00:00:00.000Z"),
    updatedAt: new Date("2029-01-01T00:00:00.000Z"),
  },
};

describe("Better Auth Supabase JWT options", () => {
  test("uses Supabase authenticated audience", () => {
    expect(betterAuthSupabaseJwtOptions.jwt?.audience).toBe("authenticated");
  });

  test("uses Better Auth user id as JWT subject", async () => {
    const subject = await Promise.resolve(betterAuthSupabaseJwtOptions.jwt?.getSubject?.(session));

    expect(subject).toBe("user_123");
  });

  test("adds the Supabase authenticated role claim", async () => {
    const payload = await Promise.resolve(
      betterAuthSupabaseJwtOptions.jwt?.definePayload?.(session)
    );

    expect(payload).toEqual({
      email: "owner@example.com",
      role: "authenticated",
    });
  });
});
