import { Button } from "@/components/ui/button";
import { ArrowUpRightIcon, Users } from "lucide-react";
import Link from "next/link";

export function CTA2() {
  return (
    <aside className="" aria-label="Call to Action">
      <div className="mx-auto max-w-(--breakpoint-xl) px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Get Started for free</h2>
          
          <div className="mt-8">
            <Button
              nativeButton={false}
              size="lg"
              className={'rounded-full h-16 pl-5 text-lg'}
              render={<Link href="/sign-in" className="flex items-center gap-4"><span>Claim your handle
                </span>
                <span className="size-10 bg-background rounded-full flex items-center justify-center">
                  <ArrowUpRightIcon className="size-5 stroke-3 text-foreground"/></span></Link>}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
