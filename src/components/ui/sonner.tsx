"use client";

import { cn } from "@/lib/utils";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ className, ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className={cn("toaster group", className)}
      icons={{
        success: null,
        info: null,
        warning: null,
        error: null,
        loading: null,
      }}
      style={
        {
          "--normal-bg": "oklch(0.205 0 0)",
          "--normal-text": "oklch(0.985 0 0)",
          "--normal-border": "oklch(1 0 0 / 10%)",
          "--border-radius": "var(--radius)",
          "--width": "min(calc(100vw - 2rem), 28rem)",
          width: "min(calc(100vw - 2rem), 28rem)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          content: "min-w-0 text-center",
          icon: "hidden",
          title: "whitespace-normal break-words text-center",
          toast:
            "cn-toast !right-0 !left-0 mx-auto !w-fit !max-w-[calc(100vw-2rem)] justify-center whitespace-normal break-words text-center sm:!max-w-md",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
