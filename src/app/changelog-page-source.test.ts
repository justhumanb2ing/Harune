import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const readSource = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("changelog page content source", () => {
  test("loads changelog content through the policy MDX pipeline", () => {
    const pageSource = readSource("src/app/(website-layout)/(policies)/changelog/page.tsx");
    const sectionSource = readSource("src/components/sections/policy-content-section.tsx");
    const changelogPath = "src/content/policies/changelog.md";

    expect(existsSync(join(process.cwd(), changelogPath))).toBe(true);
    expect(pageSource.includes('getPolicyBySlug("changelog")')).toBe(true);
    expect(pageSource.includes("WebPageJsonLd")).toBe(true);
    expect(pageSource.includes('id={absoluteUrl("/changelog")}')).toBe(true);
    expect(pageSource.includes("lastUpdated={policy.frontmatter.lastUpdated}")).toBe(true);
    expect(sectionSource.includes("children: React.ReactNode")).toBe(true);
    expect(sectionSource.includes("{children}")).toBe(true);
  });
});
