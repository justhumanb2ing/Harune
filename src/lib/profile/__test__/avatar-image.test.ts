import { describe, expect, test } from "bun:test";

import { getLoadedImageSize, getProfileImageCropFrameStyle } from "@/lib/profile/avatar-image";

describe("profile avatar image crop frame", () => {
  test("maps the crop rectangle to a full-frame crop style", () => {
    expect(
      getProfileImageCropFrameStyle(
        {
          croppedAreaPixels: {
            x: 100,
            y: 50,
            width: 200,
            height: 200,
          },
        },
        {
          width: 600,
          height: 400,
        }
      )
    ).toEqual({
      height: "200%",
      left: "-50%",
      top: "-25%",
      width: "300%",
    });
  });

  test("falls back to null when crop metadata is unavailable", () => {
    expect(getProfileImageCropFrameStyle(null, { width: 600, height: 400 })).toBeNull();
  });

  test("reads the natural image size from an already-loaded image element", () => {
    expect(
      getLoadedImageSize({
        complete: true,
        naturalHeight: 400,
        naturalWidth: 600,
      } as HTMLImageElement)
    ).toEqual({
      height: 400,
      width: 600,
    });
  });

  test("returns null when the image has not finished loading", () => {
    expect(
      getLoadedImageSize({
        complete: false,
        naturalHeight: 400,
        naturalWidth: 600,
      } as HTMLImageElement)
    ).toBeNull();
  });
});
