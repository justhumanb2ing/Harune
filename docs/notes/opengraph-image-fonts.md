# Open Graph Image Fonts

## Status

TBD

## Current Finding

`src/app/opengraph-image.tsx` uses `ImageResponse` from `next/og`. Font weight values such as `fontWeight: 900` are parsed, but they only render as expected when the matching font weight file is registered through the `fonts` option.

The current implementation does not register a custom font file, so the generated image falls back to the bundled OG font behavior instead of a real bold or black face.

## Inter

TBD: decide whether to use Inter for generated OG images.

If Inter is used, provide a supported font file such as `Inter-Black.ttf`, `Inter-Bold.ttf`, or `.woff` in the project and register it in `ImageResponse`.

`woff2` should not be used for OG generation because Satori supports `ttf`, `otf`, and `woff`.

## Implementation Shape

```tsx
const interBlack = await fetch(
  new URL("../../public/fonts/Inter-Black.ttf", import.meta.url),
).then((res) => res.arrayBuffer());

return new ImageResponse(element, {
  ...size,
  fonts: [
    {
      name: "Inter",
      data: interBlack,
      weight: 900,
      style: "normal",
    },
  ],
});
```

Text rendered with that font must use the same family name:

```tsx
fontFamily: "Inter",
fontWeight: 900,
```
