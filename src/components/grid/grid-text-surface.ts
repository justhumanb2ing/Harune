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

export function normalizeGridTextSurfaceStyle(
  style?: Partial<GridTextSurfaceStyle> | null
): GridTextSurfaceStyle {
  const backgroundColor = style?.backgroundColor?.trim() || backgroundColorOptions[0].value;

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
  return (
    backgroundColorOptions.find(
      (option) => option.id === backgroundColor || option.value === backgroundColor
    ) ?? backgroundColorOptions[0]
  );
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
