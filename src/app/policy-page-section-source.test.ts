import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const readSource = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("policy page animated content section", () => {
  test("privacy and terms use the shared animated policy section", () => {
    const privacySource = readSource("src/app/(website-layout)/(policies)/privacy/page.tsx");
    const termsSource = readSource("src/app/(website-layout)/(policies)/terms/page.tsx");
    const sectionSource = readSource("src/components/sections/policy-content-section.tsx");

    for (const source of [privacySource, termsSource]) {
      expect(source.includes("PolicyContentSection")).toBe(true);
      expect(source.includes("<header className")).toBe(false);
      expect(source.includes("<main className")).toBe(false);
    }

    expect(sectionSource.includes("<motion.div")).toBe(true);
    expect(sectionSource.includes("text-base")).toBe(true);
    expect(sectionSource.includes("text-black")).toBe(true);
    expect(sectionSource.includes("[&_p]:text-black")).toBe(true);
    expect(sectionSource.includes("[&_h2]:text-black")).toBe(true);
    expect(sectionSource.includes("[&_li::marker]:text-black")).toBe(true);
  });
});
