export const backgroundColorOptions = [
  {
    id: "red",
    label: "Red",
    className: "bg-red-500",
    checkedClassName: "data-checked:!bg-red-500",
    foregroundClassName: "text-white",
  },
  {
    id: "orange",
    label: "Orange",
    className: "bg-orange-500",
    checkedClassName: "data-checked:!bg-orange-500",
    foregroundClassName: "text-black",
  },
  {
    id: "yellow",
    label: "Yellow",
    className: "bg-yellow-500",
    checkedClassName: "data-checked:!bg-yellow-500",
    foregroundClassName: "text-black",
  },
  {
    id: "green",
    label: "Green",
    className: "bg-green-500",
    checkedClassName: "data-checked:!bg-green-500",
    foregroundClassName: "text-white",
  },
  {
    id: "blue",
    label: "Blue",
    className: "bg-blue-500",
    checkedClassName: "data-checked:!bg-blue-500",
    foregroundClassName: "text-white",
  },
  {
    id: "indigo",
    label: "Indigo",
    className: "bg-indigo-500",
    checkedClassName: "data-checked:!bg-indigo-500",
    foregroundClassName: "text-white",
  },
  {
    id: "violet",
    label: "Violet",
    className: "bg-violet-500",
    checkedClassName: "data-checked:!bg-violet-500",
    foregroundClassName: "text-white",
  },
  {
    id: "white",
    label: "White",
    className: "bg-white",
    checkedClassName: "data-checked:!bg-white",
    foregroundClassName: "text-black",
  },
  {
    id: "black",
    label: "Black",
    className: "bg-black",
    checkedClassName: "data-checked:!bg-black",
    foregroundClassName: "text-white",
  },
  {
    id: "gray",
    label: "Gray",
    className: "bg-neutral-300",
    checkedClassName: "data-checked:!bg-neutral-300",
    foregroundClassName: "text-black",
  },
] as const;

export type BackgroundColorId = (typeof backgroundColorOptions)[number]["id"];

export function getBackgroundColorOption(backgroundColorId: string) {
  return (
    backgroundColorOptions.find((option) => option.id === backgroundColorId) ??
    backgroundColorOptions[0]
  );
}
