import { describe, expect, test } from "bun:test";

import { PROFILE_BENTO_PAGE_SECTION_CLASS } from "@/components/profile/v2/profile-bento-page";

describe("profile-bento page section", () => {
  test("does not clip the public readonly resize transition at the page shell", () => {
    expect(PROFILE_BENTO_PAGE_SECTION_CLASS).not.toContain("overflow-x-clip");
    expect(PROFILE_BENTO_PAGE_SECTION_CLASS).not.toContain("overflow-hidden");
  });

  test("keeps the public readonly shell centered in compact widths", () => {
    expect(PROFILE_BENTO_PAGE_SECTION_CLASS).toContain("items-center");
    expect(PROFILE_BENTO_PAGE_SECTION_CLASS).toContain("px-6");
    expect(PROFILE_BENTO_PAGE_SECTION_CLASS).toContain("sm:px-16");
    expect(PROFILE_BENTO_PAGE_SECTION_CLASS).toContain("pt-16");
  });
});
