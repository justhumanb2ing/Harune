import { describe, expect, test } from "bun:test";

import { passwordHashing } from "@/lib/auth/password";

describe("password hashing", () => {
  test("hashes passwords and verifies matching input", async () => {
    const password = "password1234";
    const hash = await passwordHashing.hash(password);

    expect(hash === password).toBe(false);
    expect(await passwordHashing.verify({ password, hash })).toBe(true);
    expect(await passwordHashing.verify({ password: "wrong-password", hash })).toBe(false);
  });
});
