import { Button } from "@/components/ui/button";
import { env } from "@/env";
import Link from "next/link";

const signInEnabled = env.NEXT_PUBLIC_SIGNIN_ENABLED === "true";

export default function WebsiteHomepage() {
  return (
    <main className="h-full p-10">
      <section className="min-h-dvh flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-1">
          <Button
            nativeButton={false}
            size="lg"
            className={
              "h-12 w-60 max-w-60 bg-indigo-400 font-bold! hover:bg-indigo-500! shadow-sm border-indigo-400 text-base py-7"
            }
            render={
              <Link href="/sign-up" className="inline-block uppercase">
                <span className="uppercase sm:hidden">Sign up</span>
                <span className="hidden uppercase sm:inline">Sign Up For Free</span>
              </Link>
            }
          />
          {signInEnabled && (
            <Button
              nativeButton={false}
              size="lg"
              variant="link"
              render={
                <Link href="/sign-in" className="text-xs font-medium">
                  Log In
                </Link>
              }
            />
          )}
        </div>
      </section>
    </main>
  );
}
