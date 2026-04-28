import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const readSource = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("roadmap page content source", () => {
  test("loads roadmap content through the policy MDX pipeline", () => {
    const pageSource = readSource("src/app/(website-layout)/(policies)/roadmap/page.tsx");
    const footerSource = readSource("src/components/layout/footer.tsx");
    const roadmapPath = "src/content/policies/roadmap.md";

    expect(existsSync(join(process.cwd(), roadmapPath))).toBe(true);
    expect(pageSource.includes('getPolicyBySlug("roadmap")')).toBe(true);
    expect(pageSource.includes("PolicyContentSection")).toBe(true);
    expect(pageSource.includes("WebPageJsonLd")).toBe(true);
    expect(pageSource.includes('id={absoluteUrl("/roadmap")}')).toBe(true);
    expect(pageSource.includes("lastUpdated={policy.frontmatter.lastUpdated}")).toBe(true);
    expect(footerSource.includes('href="/roadmap"')).toBe(true);
  });
});
