"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { env } from "@/env";
import { appConfig } from "@/lib/config";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

const signInEnabled = env.NEXT_PUBLIC_SIGNIN_ENABLED === "true";

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full transition-all duration-300 ease-out">
      <div
        className={cn(
          "mx-auto w-full max-w-(--breakpoint-xl) px-4 transition-all duration-300 ease-out sm:px-6 lg:px-8",
          isScrolled && "mt-6 max-w-5xl"
        )}
      >
        <div
          className={cn(
            "flex h-16 items-center justify-between bg-background px-4 transition-all duration-300 ease-out sm:px-6",
            isScrolled && "h-16 rounded-full bg-background"
          )}
        >
          <div className="flex items-center transition-all duration-300 ease-out">
            <Link href={"/"} className="flex items-center justify-center">
              <Image
                src="/assets/logo.jpeg"
                alt={appConfig.projectName}
                width={40}
                height={40}
                className="rounded-xl"
              />
            </Link>
          </div>

          <div className="flex items-center gap-2 transition-all duration-300 ease-out">
            {signInEnabled && (
              <Button
                nativeButton={false}
                size="lg"
                variant="ghost"
                className="rounded-full transition-all duration-300 ease-out"
                render={
                  <Link
                    href="/sign-in"
                    className="text-sm font-medium uppercase transition-all duration-300 ease-out hover:bg-primary hover:text-white"
                  >
                    Log In
                  </Link>
                }
              />
            )}
            <Button
              nativeButton={false}
              size="lg"
              variant="default"
              className="rounded-full transition-all duration-300 ease-out"
              render={
                <Link
                  href="/sign-up"
                  className="text-sm font-medium transition-all duration-300 ease-out hover:bg-primary hover:text-white"
                >
                  <span className="uppercase sm:hidden">Sign up</span>
                  <span className="hidden uppercase sm:inline">Sign Up For Free</span>
                </Link>
              }
            />
          </div>
        </div>
      </div>
    </header>
  );
}
