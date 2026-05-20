"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { inter, pretendard } from "@/lib/fonts";
import "./globals.css";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en" className={`${pretendard.variable} ${inter.variable} h-full`}>
      <body className="h-full bg-background font-sans text-foreground antialiased">
        <main className="flex h-full items-center justify-center">
          <section className="flex flex-col items-center gap-10">
            <header className="flex flex-col items-center gap-1">
              <h1 className="text-xl font-bold">Something went off track.</h1>
              <p className="text-muted-foreground">We’re getting it back in place.</p>
            </header>

            <Button
              size={"lg"}
              type="button"
              onClick={() => unstable_retry()}
              className={
                "h-12 w-52 max-w-52 text-lg! font-bold! brand-button shadow-brand-small py-7 px-8"
              }
            >
              Try again
            </Button>
          </section>
        </main>
      </body>
    </html>
  );
}
