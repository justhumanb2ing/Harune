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

  test("setting box does not own analytics navigation", () => {
    const source = readSource("src/components/sections/setting-box.tsx");

    expect(source).not.toContain("Go to Analytics");
    expect(source).not.toContain("router.prefetch(toggleHref)");
  });

  test("section page keeps analytics action visible next to My Page", () => {
    const source = readSource("src/components/section/profile-page/section-page-client.tsx");

    expect(source).toContain("Go to Analytics");
    expect(source).toContain("ChartColumnBigIcon");
    expect(source).not.toContain("lg:hidden brand-button");
  });
});
