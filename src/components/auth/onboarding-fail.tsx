import { Button } from "@/components/ui/button";
import Link from "next/link";

type OnboardingFailProps = {
  handle?: string;
  message?: string;
};

export function OnboardingFail({ handle, message }: OnboardingFailProps) {
  const retryHref = handle
    ? `/onboarding?handle=${encodeURIComponent(handle)}`
    : "/onboarding";

  return (
    <div className="flex h-full flex-col gap-4 py-6 bg-background">
      <div className="flex-1 px-8 pb-8">
        <div className="h-full gap-10 flex flex-col justify-center items-center">
          <div className="flex flex-col justify-center items-center gap-8">
            <div className="flex flex-col justify-center items-center gap-2 text-center">
              <h1 className="text-3xl font-semibold tracking-tight">
                Failed to create your page
              </h1>
              <p className="text-muted-foreground text-base">
                {message ||
                  "Something went wrong while creating your page. Please try again."}
              </p>
            </div>

            <Button
              nativeButton={false}
              size="lg"
              className="h-12 rounded-md px-5 w-40 font-semibold text-base bg-red-400 border-red-400 hover:bg-red-500! shadow-lg"
              render={<Link href={retryHref}>Try again</Link>}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
