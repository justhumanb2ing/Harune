"use client";

import { createContext, type ReactNode, useContext } from "react";

type GridTextSurfaceContextValue = {
  foregroundClassName: string;
};

const GridTextSurfaceContext = createContext<GridTextSurfaceContextValue | null>(null);

export function GridTextSurfaceProvider({
  foregroundClassName,
  children,
}: {
  foregroundClassName: string;
  children: ReactNode;
}) {
  return (
    <GridTextSurfaceContext.Provider value={{ foregroundClassName }}>
      {children}
    </GridTextSurfaceContext.Provider>
  );
}

export function useGridTextSurface() {
  return useContext(GridTextSurfaceContext);
}
