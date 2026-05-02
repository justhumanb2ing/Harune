import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { toProfilePageApiRequest } from "@/lib/api/profile-page/adapter";

describe("profile page handle availability route adapter", () => {
  test("rewrites Next profile-page API URLs to Hono app-local paths", () => {
    const request = new Request("http://localhost/api/app/profile-page/upload-image/?draft=1", {
      body: JSON.stringify({ ok: true }),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });

    const honoRequest = toProfilePageApiRequest(request);

    expect(honoRequest.url).toBe("http://localhost/upload-image?draft=1");
    expect(honoRequest.method).toBe("POST");
    expect(honoRequest.headers.get("content-type")).toBe("application/json");
  });

  test("keeps the profile-page metadata route as a thin adapter to the profile-page Hono app", () => {
    const source = readFileSync(
      join(process.cwd(), "src/app/api/app/profile-page/route.ts"),
      "utf8"
    );

    expect(source.includes('dynamic = "force-dynamic"')).toBe(true);
    expect(source.includes("handleProfilePageApiRequest")).toBe(true);
    expect(source.includes("withAuthRequired")).toBe(false);
    expect(source.includes("NextResponse")).toBe(false);
    expect(source.includes("getProfilePageEditorData")).toBe(false);
    expect(source.includes("updateProfileMetadata")).toBe(false);
  });

  test("keeps the Next route as a thin adapter to the profile-page Hono app", () => {
    const source = readFileSync(
      join(process.cwd(), "src/app/api/app/profile-page/handle-availability/route.ts"),
      "utf8"
    );

    expect(source.includes("handleProfilePageApiRequest")).toBe(true);
    expect(source.includes("withAuthRequired")).toBe(false);
    expect(source.includes("NextResponse")).toBe(false);
    expect(source.includes("isHandleAvailableForUser")).toBe(false);
  });

  test("leaves the Better Auth route on its official Next.js handler", () => {
    const source = readFileSync(join(process.cwd(), "src/app/api/auth/[...all]/route.ts"), "utf8");

    expect(source.includes("toNextJsHandler(betterAuthServer)")).toBe(true);
    expect(source.includes("profilePageApi")).toBe(false);
    expect(source.includes("Hono")).toBe(false);
  });

  test("keeps excluded profile-page route families outside the Hono migration pass", () => {
    const excludedRoutePaths = [
      "src/app/api/app/profile-page/social-links/route.ts",
      "src/app/api/app/profile-page/social-links/[socialLinkId]/route.ts",
      "src/app/api/app/profile-page/social-links/reorder/route.ts",
      "src/app/api/app/profile-page/playlist/route.ts",
    ];

    for (const routePath of excludedRoutePaths) {
      const source = readFileSync(join(process.cwd(), routePath), "utf8");

      expect(source.includes("handleProfilePageApiRequest")).toBe(false);
    }
  });

  test("keeps the links POST route as a thin adapter to the profile-page Hono app", () => {
    const source = readFileSync(
      join(process.cwd(), "src/app/api/app/profile-page/links/route.ts"),
      "utf8"
    );

    expect(source.includes("handleProfilePageApiRequest")).toBe(true);
    expect(source.includes("withAuthRequired")).toBe(false);
    expect(source.includes("NextResponse")).toBe(false);
    expect(source.includes("createLinkItem")).toBe(false);
  });

  test("keeps the links item route as a thin adapter to the profile-page Hono app", () => {
    const source = readFileSync(
      join(process.cwd(), "src/app/api/app/profile-page/links/[linkId]/route.ts"),
      "utf8"
    );

    expect(source.includes("handleProfilePageApiRequest")).toBe(true);
    expect(source.includes("withAuthRequired")).toBe(false);
    expect(source.includes("NextResponse")).toBe(false);
    expect(source.includes("updateLinkItem")).toBe(false);
    expect(source.includes("deleteLinkItem")).toBe(false);
  });

  test("keeps the links reorder route as a thin adapter to the profile-page Hono app", () => {
    const source = readFileSync(
      join(process.cwd(), "src/app/api/app/profile-page/links/reorder/route.ts"),
      "utf8"
    );

    expect(source.includes("handleProfilePageApiRequest")).toBe(true);
    expect(source.includes("withAuthRequired")).toBe(false);
    expect(source.includes("NextResponse")).toBe(false);
    expect(source.includes("reorderLinkItems")).toBe(false);
  });

  test("keeps the text routes as thin adapters to the profile-page Hono app", () => {
    const createSource = readFileSync(
      join(process.cwd(), "src/app/api/app/profile-page/text/route.ts"),
      "utf8"
    );
    const itemSource = readFileSync(
      join(process.cwd(), "src/app/api/app/profile-page/text/[textBoxId]/route.ts"),
      "utf8"
    );
    const reorderSource = readFileSync(
      join(process.cwd(), "src/app/api/app/profile-page/text/reorder/route.ts"),
      "utf8"
    );

    for (const source of [createSource, itemSource, reorderSource]) {
      expect(source.includes("handleProfilePageApiRequest")).toBe(true);
      expect(source.includes("withAuthRequired")).toBe(false);
      expect(source.includes("NextResponse")).toBe(false);
    }
    expect(createSource.includes("createTextBoxItem")).toBe(false);
    expect(itemSource.includes("updateTextBoxItem")).toBe(false);
    expect(itemSource.includes("deleteTextBoxItem")).toBe(false);
    expect(reorderSource.includes("reorderTextBoxItems")).toBe(false);
  });

  test("keeps the profile page sync route as a thin adapter to the profile-page Hono app", () => {
    const source = readFileSync(
      join(process.cwd(), "src/app/api/app/profile-page/sync/route.ts"),
      "utf8"
    );

    expect(source.includes("handleProfilePageApiRequest")).toBe(true);
    expect(source.includes("withAuthRequired")).toBe(false);
    expect(source.includes("NextResponse")).toBe(false);
    expect(source.includes("syncProfilePageDraft")).toBe(false);
  });

  test("keeps the profile page bento sync route as a thin adapter to the profile-page Hono app", () => {
    const source = readFileSync(
      join(process.cwd(), "src/app/api/app/profile-page/bento/sync/route.ts"),
      "utf8"
    );

    expect(source.includes("handleProfilePageApiRequest")).toBe(true);
    expect(source.includes("withAuthRequired")).toBe(false);
    expect(source.includes("NextResponse")).toBe(false);
    expect(source.includes("syncProfileBentoDraft")).toBe(false);
  });

  test("keeps the profile image upload route as a thin adapter to the profile-page Hono app", () => {
    const source = readFileSync(
      join(process.cwd(), "src/app/api/app/profile-page/upload-image/route.ts"),
      "utf8"
    );

    expect(source.includes("handleProfilePageApiRequest")).toBe(true);
    expect(source.includes("withAuthRequired")).toBe(false);
    expect(source.includes("NextResponse")).toBe(false);
    expect(source.includes("createS3UploadFields")).toBe(false);
    expect(source.includes("deletePublicS3Object")).toBe(false);
  });

  test("keeps the profile bento media upload route as a thin adapter to the profile-page Hono app", () => {
    const source = readFileSync(
      join(process.cwd(), "src/app/api/app/profile-page/bento/media/upload/route.ts"),
      "utf8"
    );

    expect(source.includes("handleProfilePageApiRequest")).toBe(true);
    expect(source.includes("withAuthRequired")).toBe(false);
    expect(source.includes("NextResponse")).toBe(false);
    expect(source.includes("putTemporaryProfileBentoMediaObject")).toBe(false);
  });
});
