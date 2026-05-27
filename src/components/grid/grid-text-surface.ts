import type {
  ProfileTextAlign,
  ProfileTextSurfaceStyle,
  ProfileVerticalAlign,
} from "@/lib/profile/types";

export const backgroundColorOptions = [
  {
    id: "white",
    label: "White",
    value: "#ffffff",
    className: "bg-white",
    checkedClassName: "data-checked:!bg-white",
    foregroundClassName: "text-black",
  },
  {
    id: "gray",
    label: "Gray",
    value: "#d4d4d4",
    className: "bg-neutral-300",
    checkedClassName: "data-checked:!bg-neutral-300",
    foregroundClassName: "text-black",
  },
  {
    id: "black",
    label: "Black",
    value: "#000000",
    className: "bg-black",
    checkedClassName: "data-checked:!bg-black",
    foregroundClassName: "text-white",
  },
  {
    id: "red",
    label: "Red",
    value: "#ef4444",
    className: "bg-red-500",
    checkedClassName: "data-checked:!bg-red-500",
    foregroundClassName: "text-white",
  },
  {
    id: "orange",
    label: "Orange",
    value: "#f97316",
    className: "bg-orange-500",
    checkedClassName: "data-checked:!bg-orange-500",
    foregroundClassName: "text-black",
  },
  {
    id: "yellow",
    label: "Yellow",
    value: "#eab308",
    className: "bg-yellow-500",
    checkedClassName: "data-checked:!bg-yellow-500",
    foregroundClassName: "text-black",
  },
  {
    id: "green",
    label: "Green",
    value: "#22c55e",
    className: "bg-green-500",
    checkedClassName: "data-checked:!bg-green-500",
    foregroundClassName: "text-white",
  },
  {
    id: "blue",
    label: "Blue",
    value: "#3b82f6",
    className: "bg-blue-500",
    checkedClassName: "data-checked:!bg-blue-500",
    foregroundClassName: "text-white",
  },
  {
    id: "indigo",
    label: "Indigo",
    value: "#6366f1",
    className: "bg-indigo-500",
    checkedClassName: "data-checked:!bg-indigo-500",
    foregroundClassName: "text-white",
  },
  {
    id: "violet",
    label: "Violet",
    value: "#8b5cf6",
    className: "bg-violet-500",
    checkedClassName: "data-checked:!bg-violet-500",
    foregroundClassName: "text-white",
  },
] as const;

export type BackgroundColorId = (typeof backgroundColorOptions)[number]["id"];

export type GridTextSurfaceStyle = ProfileTextSurfaceStyle;

const HEX_COLOR_PATTERN = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function normalizeHexColorInput(value: string) {
  const match = value.trim().match(HEX_COLOR_PATTERN);

  if (!match) {
    return null;
  }

  const hex = match[1].toLowerCase();
  const normalizedHex =
    hex.length === 3
      ? hex
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : hex;

  return `#${normalizedHex}`;
}

function getHexColorLuminance(hexColor: string) {
  const normalizedHex = normalizeHexColorInput(hexColor);

  if (!normalizedHex) {
    return 1;
  }

  const channels = [1, 3, 5].map((startIndex) => {
    const channel = Number.parseInt(normalizedHex.slice(startIndex, startIndex + 2), 16) / 255;

    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });

  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

export function getForegroundClassNameForBackgroundColor(backgroundColor: string) {
  return getHexColorLuminance(backgroundColor) > 0.45 ? "text-black" : "text-white";
}

export function normalizeGridTextSurfaceStyle(
  style?: Partial<GridTextSurfaceStyle> | null
): GridTextSurfaceStyle {
  const backgroundColor =
    normalizeHexColorInput(style?.backgroundColor ?? "") ?? backgroundColorOptions[0].value;

  return {
    backgroundColor,
    textAlign:
      style?.textAlign === "center" || style?.textAlign === "end" ? style.textAlign : "start",
    verticalAlign:
      style?.verticalAlign === "center" || style?.verticalAlign === "end"
        ? style.verticalAlign
        : "start",
  };
}

export function getBackgroundColorOption(backgroundColor: string) {
  const normalizedBackgroundColor = normalizeHexColorInput(backgroundColor);
  const presetOption = backgroundColorOptions.find(
    (option) => option.id === backgroundColor || option.value === normalizedBackgroundColor
  );

  if (presetOption) {
    return presetOption;
  }

  if (!normalizedBackgroundColor) {
    return backgroundColorOptions[0];
  }

  return {
    id: "custom",
    label: normalizedBackgroundColor,
    value: normalizedBackgroundColor,
    className: "bg-transparent",
    checkedClassName: "",
    foregroundClassName: getForegroundClassNameForBackgroundColor(normalizedBackgroundColor),
  };
}

export function getTextAlignClassName(textAlign: ProfileTextAlign) {
  return textAlign === "center" ? "text-center" : textAlign === "end" ? "text-right" : "text-left";
}

export function getVerticalAlignClassName(verticalAlign: ProfileVerticalAlign) {
  return verticalAlign === "center"
    ? "items-center"
    : verticalAlign === "end"
      ? "items-end"
      : "items-start";
}

export function getGridTextSurfaceClassNames(style: GridTextSurfaceStyle) {
  const backgroundColorOption = getBackgroundColorOption(style.backgroundColor);
  const isLightSurface = backgroundColorOption.foregroundClassName === "text-black";

  return {
    backgroundColorClassName: backgroundColorOption.className,
    foregroundClassName: backgroundColorOption.foregroundClassName,
    textAlignClassName: getTextAlignClassName(style.textAlign),
    verticalAlignClassName: getVerticalAlignClassName(style.verticalAlign),
    hoverBackgroundClassName: isLightSurface ? "hover:bg-black/4" : "hover:bg-white/18",
    focusVisibleBackgroundClassName: isLightSurface
      ? "focus-visible:bg-black/6"
      : "focus-visible:bg-white/24",
  };
}
