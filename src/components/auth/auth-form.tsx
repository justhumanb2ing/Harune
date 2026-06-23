"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { FaGoogle, FaSpinner } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { getAppUrl } from "@/lib/auth/app-url";
import { authClient } from "@/lib/auth/client";
import { appConfig } from "@/lib/config";
import { invalidateAuthenticatedAppQueries } from "@/lib/react-query/app-cache";
import { cn } from "@/lib/utils";

interface AuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
  callbackUrl?: string;
  enableGoogle?: boolean;
  mode: AuthMode;
}

type AuthMode = "sign-in" | "sign-up";
type PendingAction = "google" | "demo" | AuthMode;

export function AuthForm({
  className,
  callbackUrl,
  enableGoogle = false,
  mode,
  ...props
}: AuthFormProps) {
  const [pendingAction, setPendingAction] = React.useState<PendingAction | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const resolvedCallbackUrl = callbackUrl || searchParams?.get("callbackUrl") || "/create";
  const resolvedCallbackAbsoluteUrl = getAppUrl(resolvedCallbackUrl);
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
  const signInErrorCallbackUrl = getAppUrl(`/sign-in?${errorCallbackParams.toString()}`);

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setPendingAction("google");

    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: resolvedCallbackAbsoluteUrl,
        errorCallbackURL: signInErrorCallbackUrl,
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
              callbackURL: resolvedCallbackAbsoluteUrl,
            })
          : await authClient.signUp.email({
              name: name || email.split("@")[0] || `${appConfig.projectName} User`,
              email,
              password,
              callbackURL: resolvedCallbackAbsoluteUrl,
            });

      if (result.error) {
        setErrorMessage(result.error.message || "Could not complete email authentication.");
        return;
      }

      await invalidateAuthenticatedAppQueries(queryClient);
      router.push(resolvedCallbackUrl);
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
    <div className={cn("flex flex-col gap-12", className)} {...props}>
      <div className="space-y-2">
        <EmailPasswordForm
          formId={formId}
          mode={mode}
          defaultName={defaultName}
          isDisabled={isLoading}
          showSocialAccountReset={mode === "sign-in" && enableGoogle && hasEmailInputValue}
          onInputValueChange={setHasEmailInputValue}
          onSubmit={(event) => handleEmailAuth(mode, event)}
        />

        {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm font-bold uppercase">or</span>
      </div>

      <div className="flex flex-col gap-1">
        {shouldShowEmailButton ? (
          <Button
            type="submit"
            form={formId}
            disabled={isLoading}
            className="h-12 py-6 w-full text-base font-semibold shadow-lg border-foreground"
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
            className="h-12 w-full py-6 font-semibold text-base border-indigo-400 bg-indigo-400 hover:bg-indigo-500 text-white!"
          >
            {pendingAction === "google" ? (
              <FaSpinner className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FaGoogle className="mr-2 h-4 w-4" />
            )}
            Continue with Google
          </Button>
        ) : null}
      </div>

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
  showSocialAccountReset: boolean;
  onInputValueChange: (hasValue: boolean) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

function EmailPasswordForm({
  formId,
  mode,
  defaultName,
  isDisabled,
  showSocialAccountReset,
  onInputValueChange,
  onSubmit,
}: EmailPasswordFormProps) {
  const isSignUp = mode === "sign-up";
  const [passwordVisible, setPasswordVisible] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  const handleTogglePasswordVisiblity = () => setPasswordVisible((prev) => !prev);
  const handleInputChange = (event: React.FormEvent<HTMLFormElement>) => {
    const formData = new FormData(event.currentTarget);
    const hasValue = Array.from(formData.values()).some(
      (value) => typeof value === "string" && value.trim().length > 0
    );

    onInputValueChange(hasValue);
  };
  const handleClearInputs = () => {
    if (!formRef.current) {
      return;
    }

    for (const element of formRef.current.elements) {
      if (element instanceof HTMLInputElement) {
        element.value = "";
      }
    }

    onInputValueChange(false);
  };

  return (
    <form
      ref={formRef}
      id={formId}
      onSubmit={onSubmit}
      onInput={handleInputChange}
      className="relative space-y-2"
    >
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
                className="h-8 text-black font-semibold shadow-xs px-3"
              >
                {passwordVisible ? "Hide" : "Show"}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </div>
      </div>

      {showSocialAccountReset ? (
        <button
          type="button"
          disabled={isDisabled}
          onClick={handleClearInputs}
          className="absolute top-[calc(100%+0.5rem)] text-sm font-medium underline underline-offset-2 text-[#768CFF] disabled:cursor-not-allowed disabled:opacity-60"
        >
          continue with a social account
        </button>
      ) : null}
    </form>
  );
}
