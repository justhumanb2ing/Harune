"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { invalidateAuthenticatedAppQueries } from "@/lib/react-query/app-cache";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { FaGoogle, FaSpinner } from "react-icons/fa";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "../ui/input-group";

interface AuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
  callbackUrl?: string;
  enableGoogle?: boolean;
  mode: AuthMode;
}

type AuthMode = "sign-in" | "sign-up";

export function AuthForm({
  className,
  callbackUrl,
  enableGoogle = false,
  mode,
  ...props
}: AuthFormProps) {
  const [pendingAction, setPendingAction] = React.useState<"google" | AuthMode | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const resolvedCallbackUrl = callbackUrl || searchParams?.get("callbackUrl") || "/post-sign-in";
  const errorCallbackParams = new URLSearchParams();
  const callbackUrlParam = searchParams?.get("callbackUrl");
  const handleParam = searchParams?.get("handle");
  const [hasEmailInputValue, setHasEmailInputValue] = React.useState(!!handleParam);
  const defaultName = handleParam || "";
  const isLoading = pendingAction !== null;
  const formId = `auth-${mode}-form`;

  if (callbackUrlParam) {
    errorCallbackParams.set("callbackUrl", callbackUrlParam);
  }

  if (handleParam) {
    errorCallbackParams.set("handle", handleParam);
  }

  errorCallbackParams.set("oauth", "failed");
  const errorCallbackUrl = `/sign-in?${errorCallbackParams.toString()}`;

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setPendingAction("google");

    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: resolvedCallbackUrl,
        errorCallbackURL: errorCallbackUrl,
      });

      if (result.error) {
        setErrorMessage(result.error.message || "Could not start Google sign-in.");
      }
    } catch (error) {
      console.error("Authentication error:", error);
      setErrorMessage("Could not start Google sign-in.");
    } finally {
      setPendingAction(null);
    }
  };

  const handleEmailAuth = async (mode: AuthMode, event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setPendingAction(mode);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const name = String(formData.get("name") || "").trim();

    try {
      const result =
        mode === "sign-in"
          ? await authClient.signIn.email({
              email,
              password,
              callbackURL: resolvedCallbackUrl,
            })
          : await authClient.signUp.email({
              name: name || email.split("@")[0] || "Leeve User",
              email,
              password,
              callbackURL: resolvedCallbackUrl,
            });

      if (result.error) {
        setErrorMessage(result.error.message || "Could not complete email authentication.");
        return;
      }

      await invalidateAuthenticatedAppQueries(queryClient);
      router.push(resolvedCallbackUrl);
      router.refresh();
    } catch (error) {
      console.error("Authentication error:", error);
      setErrorMessage("Could not complete email authentication.");
    } finally {
      setPendingAction(null);
    }
  };

  const shouldShowGoogleButton = enableGoogle && !hasEmailInputValue;
  const shouldShowEmailButton = hasEmailInputValue || !enableGoogle;

  return (
    <div className={cn("flex flex-col gap-8", className)} {...props}>
      <div className="space-y-2">
        <EmailPasswordForm
          formId={formId}
          mode={mode}
          defaultName={defaultName}
          isDisabled={isLoading}
          onInputValueChange={setHasEmailInputValue}
          onSubmit={(event) => handleEmailAuth(mode, event)}
        />

        {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm font-bold uppercase">or</span>
      </div>

      {shouldShowEmailButton ? (
        <Button
          type="submit"
          form={formId}
          disabled={isLoading}
          className="h-12 py-6 w-full font-semibold shadow-lg border-foreground"
        >
          {pendingAction === mode ? <FaSpinner className="mr-2 h-4 w-4 animate-spin" /> : null}
          {mode === "sign-up" ? "Create account" : "Log in"}
        </Button>
      ) : shouldShowGoogleButton ? (
        <Button
          variant="outline"
          type="button"
          disabled={isLoading}
          onClick={handleGoogleSignIn}
          className="h-12 w-full py-6 font-semibold shadow-lg border-indigo-400 bg-indigo-400 hover:bg-indigo-500 text-white!"
        >
          {pendingAction === "google" ? (
            <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FaGoogle className="mr-2 h-4 w-4" />
          )}
          Continue with Google
        </Button>
      ) : null}

      {mode === "sign-up" ? (
        <p className="mb-8 text-sm text-muted-foreground space-x-1">
          <span>or</span>
          <Link href="/sign-in" prefetch={false} className="">
            log in
          </Link>
        </p>
      ) : (
        <p className="mb-8 text-sm text-muted-foreground space-x-1">
          <span>or</span>
          <Link href="/sign-up" prefetch={false} className="">
            sign up
          </Link>
        </p>
      )}
    </div>
  );
}

type EmailPasswordFormProps = {
  formId: string;
  mode: AuthMode;
  defaultName?: string;
  isDisabled: boolean;
  onInputValueChange: (hasValue: boolean) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

function EmailPasswordForm({
  formId,
  mode,
  defaultName,
  isDisabled,
  onInputValueChange,
  onSubmit,
}: EmailPasswordFormProps) {
  const isSignUp = mode === "sign-up";
  const [passwordVisible, setPasswordVisible] = React.useState(false);

  const handleTogglePasswordVisiblity = () => setPasswordVisible((prev) => !prev);
  const handleInputChange = (event: React.FormEvent<HTMLFormElement>) => {
    const formData = new FormData(event.currentTarget);
    const hasValue = Array.from(formData.values()).some(
      (value) => typeof value === "string" && value.trim().length > 0
    );

    onInputValueChange(hasValue);
  };

  return (
    <form id={formId} onSubmit={onSubmit} onInput={handleInputChange} className="space-y-2">
      {isSignUp ? (
        <div>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="Your name"
            autoComplete="off"
            defaultValue={defaultName}
            className="h-12 bg-secondary border-0"
            disabled={isDisabled}
          />
        </div>
      ) : null}

      <div className="flex flex-col lg:flex-row gap-2 w-full">
        <div className="space-y-2 flex-1">
          <Input
            id={`${mode}-email`}
            name="email"
            type="email"
            placeholder="Email address"
            autoComplete="off"
            required
            className="h-12 bg-secondary border-0"
            disabled={isDisabled}
          />
        </div>

        <div className="space-y-2 flex-1">
          <InputGroup className="h-12 bg-secondary border-0">
            <InputGroupInput
              id={`${mode}-password`}
              name="password"
              type={passwordVisible ? "text" : "password"}
              placeholder="Password"
              autoComplete="off"
              required
              minLength={8}
              disabled={isDisabled}
            />
            <InputGroupAddon align="inline-end" className="pr-3">
              <InputGroupButton
                type="button"
                aria-label={passwordVisible ? "Hide password" : "Show password"}
                title="Toggle Password"
                onClick={handleTogglePasswordVisiblity}
                className="bg-background h-8 text-black font-semibold shadow-xs px-3"
              >
                {passwordVisible ? "Hide" : "Show"}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </div>
      </div>
    </form>
  );
}
