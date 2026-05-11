"use client";

import { SpinnerGapIcon } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/error";
import type { getMeResponse } from "@/lib/api/generated/http/me-api/me-api";
import { getGetMeQueryKey, prefetchGetMeQuery } from "@/lib/api/generated/http/me-api/me-api";
import { createSignInCallbackHref, resolveAppEntryHref } from "@/lib/auth/app-entry";
import { cn } from "@/lib/utils";

type AppEntryCtaButtonProps = {
  children: ReactNode;
  className?: string;
  next?: string;
  size?: "default" | "xs" | "sm" | "lg";
  variant?: "default" | "outline" | "secondary" | "ghost" | "destructive" | "link";
};

export function AppEntryCtaButton({
  children,
  className,
  next,
  size = "default",
  variant = "default",
}: AppEntryCtaButtonProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isResolving, setIsResolving] = useState(false);
  const prefetchMe = () => {
    void prefetchGetMeQuery(queryClient);
  };

  const handleClick = async () => {
    if (isResolving) {
      return;
    }

    setIsResolving(true);

    try {
      await prefetchGetMeQuery(queryClient);

      const me = queryClient.getQueryData<getMeResponse>(getGetMeQueryKey());

      if (!me || me.status !== 200) {
        throw new Error("Failed to load user.");
      }

      router.push(resolveAppEntryHref({ next, profilePage: me.data.profilePage }));
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        router.push(createSignInCallbackHref(next));
        return;
      }

      router.push("/sign-in");
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <Button asChild className={cn(className)} size={size} variant={variant}>
      <button
        aria-busy={isResolving}
        disabled={isResolving}
        type="button"
        onClick={handleClick}
        onFocus={prefetchMe}
        onPointerEnter={prefetchMe}
      >
        {isResolving ? <SpinnerGapIcon className="size-4 animate-spin" /> : children}
      </button>
    </Button>
  );
}
