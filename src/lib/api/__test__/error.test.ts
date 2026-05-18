import { describe, expect, test } from "bun:test";

import { createApiError, getApiErrorDescription } from "@/lib/api/error";

describe("api error", () => {
  test("extracts nested error messages from api responses", () => {
    const error = createApiError(
      JSON.stringify({
        error: {
          code: "validation_error",
          message: "Clock timezone is required.",
          description: "Clock payload failed validation.",
        },
      }),
      400
    );

    expect(error.message).toBe("Clock timezone is required.");
    expect(error.status).toBe(400);
    expect(getApiErrorDescription(error)).toBe("Clock payload failed validation.");
  });
});
