"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  const handleGoogleSignIn = async () => {
    setIsLoading(true);

    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: resolvedCallbackUrl,
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
      <div className="flex flex-col gap-2">
        <Label htmlFor="google-sign-in">Google 계정으로 계속하기</Label>
        <Input
          id="google-sign-in"
          value="Google OAuth만 지원합니다"
          disabled
          readOnly
          className="w-full py-6 text-muted-foreground"
        />
      </div>

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
