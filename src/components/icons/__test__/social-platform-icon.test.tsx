import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { SocialPlatformIcon } from "@/components/icons";

describe("SocialPlatformIcon", () => {
  test("falls back safely for unknown platforms", () => {
    expect(() =>
      renderToStaticMarkup(<SocialPlatformIcon platform={"facebook" as never} />)
    ).not.toThrow();
  });
});
