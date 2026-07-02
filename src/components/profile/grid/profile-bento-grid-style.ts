export function getGridPlaceholderRadiusClassName(options: {
  isSectionDragActive: boolean;
  isThinPlaceholderShapeActive: boolean;
}) {
  if (options.isSectionDragActive || options.isThinPlaceholderShapeActive) {
    return "[&_.react-grid-placeholder]:rounded-2xl!";
  }

  return "[&_.react-grid-placeholder]:rounded-[1.5rem]!";
}

export function getSectionDragSiblingGuardClassName(isSectionDragActive: boolean) {
  if (!isSectionDragActive) {
    return "";
  }

  return "[&_.react-grid-item:not(.react-draggable-dragging):not(.react-grid-placeholder)]:pointer-events-none";
}
