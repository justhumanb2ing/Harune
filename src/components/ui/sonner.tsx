"use client";

import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ className, ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
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
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
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
