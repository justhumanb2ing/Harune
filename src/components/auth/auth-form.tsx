"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import * as React from "react";
import { FaGoogle, FaSpinner } from "react-icons/fa";
import { toast } from "sonner";

interface AuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
  callbackUrl?: string;
}

export function AuthForm({ className, callbackUrl, ...props }: AuthFormProps) {
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const searchParams = useSearchParams();
  const resolvedCallbackUrl = callbackUrl || searchParams?.get("callbackUrl") || "/section";
  const errorCallbackParams = new URLSearchParams();
  const callbackUrlParam = searchParams?.get("callbackUrl");
  const handleParam = searchParams?.get("handle");

  if (callbackUrlParam) {
    errorCallbackParams.set("callbackUrl", callbackUrlParam);
  }

  if (handleParam) {
    errorCallbackParams.set("handle", handleParam);
  }

  errorCallbackParams.set("oauth", "failed");
  const errorCallbackUrl = `/sign-in?${errorCallbackParams.toString()}`;

  const handleGoogleSignIn = async () => {
    setIsLoading(true);

    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: resolvedCallbackUrl,
        errorCallbackURL: errorCallbackUrl,
      });

      if (result.error) {
        toast.error(result.error.message || "Google 로그인을 시작하지 못했습니다.");
      }
    } catch (error) {
      console.error("Authentication error:", error);
      toast.error("Google 로그인을 시작하지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Button
        variant="outline"
        type="button"
        disabled={isLoading}
        onClick={handleGoogleSignIn}
        className="w-full py-6"
      >
        {isLoading ? (
          <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FaGoogle className="mr-2 h-4 w-4" />
        )}
        Continue with Google
      </Button>
    </div>
  );
}
