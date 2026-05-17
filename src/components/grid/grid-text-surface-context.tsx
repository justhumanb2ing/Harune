"use client";

import { createContext, type ReactNode, useContext } from "react";

type GridTextSurfaceContextValue = {
  backgroundColorClassName: string;
  foregroundClassName: string;
  textAlignClassName: string;
  verticalAlignClassName: string;
};

const GridTextSurfaceContext = createContext<GridTextSurfaceContextValue | null>(null);

export function GridTextSurfaceProvider({
  backgroundColorClassName,
  foregroundClassName,
  textAlignClassName,
  verticalAlignClassName,
  children,
}: {
  backgroundColorClassName: string;
  foregroundClassName: string;
  textAlignClassName: string;
  verticalAlignClassName: string;
  children: ReactNode;
}) {
  return (
    <GridTextSurfaceContext.Provider
      value={{
        backgroundColorClassName,
        foregroundClassName,
        textAlignClassName,
        verticalAlignClassName,
      }}
    >
      {children}
    </GridTextSurfaceContext.Provider>
  );
}

export function useGridTextSurface() {
  return useContext(GridTextSurfaceContext);
}
