import { describe, expect, test } from "bun:test";
import { buildProfileBentoSharePayload } from "../profile-bento-share-intents";

describe("profile-bento-share-intents", () => {
  test("builds x share intent with text and url", () => {
    const payload = buildProfileBentoSharePayload("x", {
      handle: "leeve",
      name: "Leeve",
    });

    expect(payload.href).toBe(
      "https://twitter.com/intent/tweet?text=Built%20a%20little%20space%20online.%20Take%20a%20look%20%E2%86%93&url=https%3A%2F%2Fharune.me%2Fleeve"
    );
  });

  test("builds facebook, linkedin, whatsapp, snapchat, and email share intents", () => {
    expect(
      buildProfileBentoSharePayload("facebook", {
        handle: "leeve",
        name: "",
      }).href
    ).toBe("https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fharune.me%2Fleeve");

    expect(
      buildProfileBentoSharePayload("linkedin", {
        handle: "leeve",
        name: "",
      }).href
    ).toBe("https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fharune.me%2Fleeve");

    expect(
      buildProfileBentoSharePayload("whatsapp", {
        handle: "leeve",
        name: "",
      }).href
    ).toBe(
      "https://api.whatsapp.com/send?text=Built%20a%20little%20space%20online.%20Take%20a%20look%20%E2%86%93%0Ahttps%3A%2F%2Fharune.me%2Fleeve"
    );

    expect(
      buildProfileBentoSharePayload("snapchat", {
        handle: "leeve",
        name: "",
      }).href
    ).toBe("https://www.snapchat.com/share?link=https%3A%2F%2Fharune.me%2Fleeve");

    expect(
      buildProfileBentoSharePayload("email", {
        handle: "leeve",
        name: "Leeve",
      }).href
    ).toBe(
      "mailto:?subject=Built%20a%20little%20space%20online.%20Take%20a%20look%20%E2%86%93&body=Built%20a%20little%20space%20online.%20Take%20a%20look%20%E2%86%93%0Ahttps%3A%2F%2Fharune.me%2Fleeve"
    );
  });

  test("returns null href for threads native share fallback", () => {
    expect(
      buildProfileBentoSharePayload("threads", {
        handle: "leeve",
        name: "Leeve",
      }).href
    ).toBe(
      "https://www.threads.com/intent/post?text=Built%20a%20little%20space%20online.%20Take%20a%20look%20%E2%86%93&url=https%3A%2F%2Fharune.me%2Fleeve"
    );
  });
});
