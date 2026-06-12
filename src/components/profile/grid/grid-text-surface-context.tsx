"use client";

import { createContext, type ReactNode, useContext } from "react";

type GridTextSurfaceContextValue = {
  backgroundColorClassName: string;
  foregroundClassName: string;
  textAlignClassName: string;
  verticalAlignClassName: string;
  hoverBackgroundClassName: string;
  focusVisibleBackgroundClassName: string;
};

const GridTextSurfaceContext = createContext<GridTextSurfaceContextValue | null>(null);

export function GridTextSurfaceProvider({
  backgroundColorClassName,
  foregroundClassName,
  textAlignClassName,
  verticalAlignClassName,
  hoverBackgroundClassName,
  focusVisibleBackgroundClassName,
  children,
}: {
  backgroundColorClassName: string;
  foregroundClassName: string;
  textAlignClassName: string;
  verticalAlignClassName: string;
  hoverBackgroundClassName: string;
  focusVisibleBackgroundClassName: string;
  children: ReactNode;
}) {
  return (
    <GridTextSurfaceContext.Provider
      value={{
        backgroundColorClassName,
        foregroundClassName,
        textAlignClassName,
        verticalAlignClassName,
        hoverBackgroundClassName,
        focusVisibleBackgroundClassName,
      }}
    >
      {children}
    </GridTextSurfaceContext.Provider>
  );
}

export function useGridTextSurface() {
  return useContext(GridTextSurfaceContext);
}
