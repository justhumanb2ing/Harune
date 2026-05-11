import { describe, expect, test } from "bun:test";

import { getErrorMessage } from "@/lib/error-message";

describe("getErrorMessage", () => {
  test("returns string values as-is", () => {
    expect(getErrorMessage("Upload failed")).toBe("Upload failed");
  });

  test("unwraps nested error objects", () => {
    expect(
      getErrorMessage({
        error: {
          code: "validation_error",
          message: "Invalid URL.",
        },
      })
    ).toBe("Invalid URL.");
  });

  test("reads direct message fields from objects", () => {
    expect(
      getErrorMessage({
        message: "Failed to get upload URL",
      })
    ).toBe("Failed to get upload URL");
  });

  test("reads Error.message values", () => {
    expect(getErrorMessage(new Error("Request failed"))).toBe("Request failed");
  });

  test("falls back for unsupported values", () => {
    expect(getErrorMessage(undefined, "Fallback message")).toBe("Fallback message");
  });
});
