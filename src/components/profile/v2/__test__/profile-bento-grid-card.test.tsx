import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { ProfileBentoGridCard } from "@/components/profile/v2/profile-bento-grid-card";
import type { ProfileBentoItem } from "@/lib/profile/types";

describe("ProfileBentoGridCard", () => {
  test("renders map bentos on the server without touching the browser map implementation", () => {
    const item: ProfileBentoItem = {
      id: "map-bento-1",
      type: "map",
      layout: {
        desktop: { x: 0, y: 0, w: 2, h: 4 },
        compact: { x: 0, y: 0, w: 2, h: 4 },
      },
      content: {
        caption: "Somewhere",
        latitude: 37.5665,
        longitude: 126.978,
        url: "https://www.google.com/maps?q=37.566500,126.978000",
        zoom: 13,
      },
    };

    const markup = renderToStaticMarkup(<ProfileBentoGridCard item={item} />);

    expect(markup.includes("data-profile-bento-map-loading")).toBe(true);
  });
});
