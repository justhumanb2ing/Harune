import { readFile } from "node:fs/promises";
import { join } from "node:path";

type PretendardWeight = 400 | 600 | 700 | 800 | 900;

const pretendardFontFiles: Record<PretendardWeight, string> = {
  400: "Pretendard-Regular.ttf",
  600: "Pretendard-SemiBold.ttf",
  700: "Pretendard-Bold.ttf",
  800: "Pretendard-ExtraBold.ttf",
  900: "Pretendard-Black.ttf",
};

const loadPretendardFont = async (weight: PretendardWeight) => {
  const buffer = await readFile(join(process.cwd(), "public/fonts", pretendardFontFiles[weight]));
  const data = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  ) as ArrayBuffer;

  return {
    name: "Pretendard",
    data,
    style: "normal" as const,
    weight,
  };
};

export const loadPretendardFonts = async (weights: PretendardWeight[]) => {
  const uniqueWeights = [...new Set(weights)] as PretendardWeight[];

  return Promise.all(uniqueWeights.map((weight) => loadPretendardFont(weight)));
};
