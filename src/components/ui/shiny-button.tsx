import Link from "next/link";
import type React from "react";

import { cn } from "@/lib/utils";

type ShinyButtonOwnProps = {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  href?: React.ComponentProps<typeof Link>["href"];
  prefetch?: React.ComponentProps<typeof Link>["prefetch"];
};

type ShinyButtonProps = ShinyButtonOwnProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> &
  React.AnchorHTMLAttributes<HTMLAnchorElement>;

export function ShinyButton({
  children,
  className,
  contentClassName,
  href,
  ...props
}: ShinyButtonProps) {
  const baseClassName = cn(
    "relative isolate cursor-pointer overflow-hidden rounded-lg border px-6 py-2 font-medium backdrop-blur-xl transition-shadow duration-300 ease-in-out hover:shadow dark:bg-[radial-gradient(circle_at_50%_0%,var(--primary)/10%_0%,transparent_60%)] dark:hover:shadow-[0_0_20px_var(--primary)/10%]",
    className
  );

  const innerContent = (
    <>
      <span
        className={cn(
          "relative z-20 block size-full text-sm tracking-wide text-[rgb(0,0,0,65%)] uppercase dark:font-light dark:text-[rgb(255,255,255,90%)]",
          contentClassName
        )}
      >
        {children}
      </span>
      <span
        aria-hidden
        style={{
          backgroundImage:
            "linear-gradient(-75deg,var(--primary)/10% calc(var(--x)+20%),var(--primary)/50% calc(var(--x)+25%),var(--primary)/10% calc(var(--x)+100%))",
          mask: "linear-gradient(rgb(0,0,0), rgb(0,0,0)) content-box exclude,linear-gradient(rgb(0,0,0), rgb(0,0,0))",
          WebkitMask:
            "linear-gradient(rgb(0,0,0), rgb(0,0,0)) content-box exclude,linear-gradient(rgb(0,0,0), rgb(0,0,0))",
        }}
        className="pointer-events-none absolute inset-0 z-10 block animate-shine rounded-[inherit] p-px motion-reduce:animate-none"
      />
    </>
  );

  if (href) {
    const { prefetch, ...linkProps } = props;

    return (
      <Link href={href} prefetch={prefetch} className={baseClassName} {...linkProps}>
        {innerContent}
      </Link>
    );
  }

  return (
    <button className={baseClassName} type={props.type ?? "button"} {...props}>
      {innerContent}
    </button>
  );
}
