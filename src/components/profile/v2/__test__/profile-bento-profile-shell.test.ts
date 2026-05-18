import { describe, expect, test } from "bun:test";

import { getProfileBentoProfileShellClassName } from "@/components/profile/v2/profile-bento-profile-shell";

describe("profile-bento profile shell", () => {
  test("keeps desktop shell fixed and compact shell aligned to the compact canvas", () => {
    expect(getProfileBentoProfileShellClassName()).toContain("xl:shrink-0");
    expect(getProfileBentoProfileShellClassName()).toContain("xl:w-[500px]");
    expect(getProfileBentoProfileShellClassName()).toContain("w-[360px]");
    expect(getProfileBentoProfileShellClassName()).toContain("sm:w-[400px]");
    expect(getProfileBentoProfileShellClassName()).not.toContain("425px");
    expect(getProfileBentoProfileShellClassName(true)).toContain("w-[360px]");
    expect(getProfileBentoProfileShellClassName(true)).toContain("sm:w-[400px]");
    expect(getProfileBentoProfileShellClassName(true)).not.toContain("425px");
  });
});
