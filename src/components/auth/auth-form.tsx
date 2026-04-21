"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { appConfig } from "@/lib/config";
import { cn } from "@/lib/utils";
import { type LoginInput, loginSchema } from "@/lib/validations/auth.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { FaGithub, FaGoogle, FaSpinner } from "react-icons/fa";
import { toast } from "sonner";

interface AuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
  callbackUrl?: string;
  enableGoogleSignIn?: boolean;
  enableGithubSignIn?: boolean;
}

export function AuthForm({
  className,
  callbackUrl,
  enableGoogleSignIn = true,
  enableGithubSignIn = true,
  ...props
}: AuthFormProps) {
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [email, setEmail] = React.useState<string>("");
  const searchParams = useSearchParams();
  const router = useRouter();
  const showPasswordAuth = appConfig.auth?.enablePasswordAuth;
  const showGoogleAuth = enableGoogleSignIn;
  const showGithubAuth = enableGithubSignIn;
  const showSocialAuth = showGoogleAuth || showGithubAuth;
  const resolvedCallbackUrl = callbackUrl || searchParams?.get("callbackUrl") || "/app";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const handleImpersonation = React.useCallback(
    async (token: string) => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/auth/impersonate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            signedToken: token,
            callbackUrl: resolvedCallbackUrl,
          }),
        });

        const result = await response.json();

        if (!response.ok || !result?.success) {
          toast.error("Failed to impersonate user");
        } else if (result?.url) {
          router.push(result.url);
        }
      } catch (error) {
        console.error("Impersonation error:", error);
        toast.error("Failed to impersonate user");
      } finally {
        setIsLoading(false);
      }
    },
    [resolvedCallbackUrl, router]
  );

  React.useEffect(() => {
    const impersonateToken = searchParams?.get("impersonateToken");
    if (impersonateToken) {
      handleImpersonation(impersonateToken);
    }
  }, [searchParams, handleImpersonation]);

  const handleSocialSignIn = async (provider: "google" | "github", providerLabel: string) => {
    setIsLoading(true);
    try {
      const result = await authClient.signIn.social({
        provider,
        callbackURL: resolvedCallbackUrl,
      });
      if (result.error) {
        toast.error(result.error.message || `Failed to continue with ${providerLabel}`);
      }
    } catch (error) {
      console.error("Authentication error:", error);
      toast.error(`Failed to continue with ${providerLabel}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSignIn = async (data: LoginInput) => {
    setIsLoading(true);

    try {
      let result = await authClient.signIn.email({
        email: data.email,
        password: data.password,
        callbackURL: resolvedCallbackUrl,
      });

      if (result.error) {
        const legacyResponse = await fetch("/api/auth/legacy-sign-in", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: data.email,
            password: data.password,
          }),
        });

        if (!legacyResponse.ok) {
          toast.error("Invalid email or password");
          return;
        }

        result = await authClient.signIn.email({
          email: data.email,
          password: data.password,
          callbackURL: resolvedCallbackUrl,
        });
      }

      if (result.error) {
        toast.error("Invalid email or password");
      } else if (result.data?.url) {
        router.push(result.data.url);
      } else {
        router.push(resolvedCallbackUrl);
      }
    } catch (error) {
      console.error("Authentication error:", error);
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await authClient.signIn.magicLink({
        email,
        callbackURL: resolvedCallbackUrl,
      });

      if (result.error) {
        toast.error("Failed to send login email");
      } else {
        toast.success("Check your email for the login link");
        setEmail("");
      }
    } catch (error) {
      console.error("Authentication error:", error);
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {showSocialAuth ? (
        <>
          {showGoogleAuth ? (
            <Button
              variant="outline"
              type="button"
              disabled={isLoading}
              onClick={() => handleSocialSignIn("google", "Google")}
              className="w-full py-6"
            >
              {isLoading ? (
                <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FaGoogle className="mr-2 h-4 w-4" />
              )}
              Continue with Google
            </Button>
          ) : null}

          {showGithubAuth ? (
            <Button
              variant="outline"
              type="button"
              disabled={isLoading}
              onClick={() => handleSocialSignIn("github", "GitHub")}
              className="w-full py-6"
            >
              {isLoading ? (
                <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FaGithub className="mr-2 h-4 w-4" />
              )}
              Continue with GitHub
            </Button>
          ) : null}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with {showPasswordAuth ? "password" : "email"}
              </span>
            </div>
          </div>
        </>
      ) : null}

      {!showSocialAuth ? (
        <div className="text-xs uppercase text-muted-foreground">
          Continue with {showPasswordAuth ? "password" : "email"}
        </div>
      ) : null}

      {showPasswordAuth ? (
        <form onSubmit={handleSubmit(handlePasswordSignIn)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              placeholder="name@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              {...register("email")}
              className="w-full py-6"
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/reset-password"
                className="text-xs text-primary hover:text-primary/90 underline underline-offset-4"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              placeholder="Enter your password"
              type="password"
              autoComplete="current-password"
              disabled={isLoading}
              {...register("password")}
              className="w-full py-6"
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" disabled={isLoading} className="w-full py-6">
            {isLoading && <FaSpinner className="mr-2 h-4 w-4 animate-spin" />}
            Sign In
          </Button>
        </form>
      ) : (
        <form onSubmit={handleEmailSignIn} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              placeholder="name@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full py-6"
            />
          </div>
          <Button type="submit" disabled={isLoading} className="w-full py-6">
            {isLoading && <FaSpinner className="mr-2 h-4 w-4 animate-spin" />}
            Continue with Email
          </Button>
        </form>
      )}
    </div>
  );
}
