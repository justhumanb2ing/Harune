import { env } from "@/env";
import Link from "next/link";
import { Button } from "../ui/button";

const signInEnabled = env.NEXT_PUBLIC_SIGNIN_ENABLED === "true";

export default function MainHeroSection() {
  return (
    <section className="min-h-dvh flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-1">
        <Button
          nativeButton={false}
          size="lg"
          className={"h-12 w-68 max-w-68 font-bold! brand-button text-base py-7"}
          render={
            <Link href="/join" className="inline-block uppercase">
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
              <Link href="/login" className="text-xs font-medium">
                Log In
              </Link>
            }
          />
        )}
      </div>
    </section>
  );
}
