"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/error";
import type { GetMe200 } from "@/lib/api/generated/http/schemas/me-api";
import { createSignInCallbackHref, resolveAppEntryHref } from "@/lib/auth/app-entry";
import { meQueryOptions } from "@/lib/users/queries";
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
    void queryClient.prefetchQuery(meQueryOptions());
  };

  const handleClick = async () => {
    if (isResolving) {
      return;
    }

    setIsResolving(true);

    try {
      const me = (await queryClient.fetchQuery(meQueryOptions())) as unknown as GetMe200;
      router.push(resolveAppEntryHref({ next, profilePage: me.profilePage }));
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
        {children}
      </button>
    </Button>
  );
}
