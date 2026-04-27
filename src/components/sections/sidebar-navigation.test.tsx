import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const readSource = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("sidebar navigation prefetch policy", () => {
  test("core sidebar nav keeps links accessible and prefetches likely app routes on intent", () => {
    const source = readSource("src/components/sections/sidebar.tsx");

    expect(source).toContain('aria-current={isActive ? "page" : undefined}');
    expect(source).toContain("router.prefetch(href)");
    expect(source).toContain('prefetch={href === "/post-sign-in" ? false : undefined}');
  });

  test("setting toggle prefetches handle routes but not post-sign-in fallback", () => {
    const source = readSource("src/components/sections/setting-box.tsx");

    expect(source).toContain("router.prefetch(toggleHref)");
    expect(source).toContain("prefetch={profilePage?.handle ? undefined : false}");
  });
});
