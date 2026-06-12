"use client";

import { CheckIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { appConfig } from "@/lib/config";
import { getProfileAppPath } from "@/lib/profile/app-paths";
import { cn } from "@/lib/utils";

const SHARE_PAGE_RESET_DELAY_MS = 2000;

type ProfileBentoPublicShareButtonProps = {
  className?: string;
  handle: string;
};

export function ProfileBentoPublicShareButton({
  className,
  handle,
}: ProfileBentoPublicShareButtonProps) {
  const [isCopied, setIsCopied] = useState(false);
  const copyResetTimeoutRef = useRef<number | null>(null);
  const href = `${appConfig.url}${getProfileAppPath(handle)}`;

  useEffect(() => {
    return () => {
      if (copyResetTimeoutRef.current !== null) {
        window.clearTimeout(copyResetTimeoutRef.current);
      }
    };
  }, []);

  const scheduleCopyReset = () => {
    if (copyResetTimeoutRef.current !== null) {
      window.clearTimeout(copyResetTimeoutRef.current);
    }

    copyResetTimeoutRef.current = window.setTimeout(() => {
      setIsCopied(false);
      copyResetTimeoutRef.current = null;
    }, SHARE_PAGE_RESET_DELAY_MS);
  };

  const handleCopyPageUrl = async () => {
    try {
      await navigator.clipboard.writeText(href);
      setIsCopied(true);
      scheduleCopyReset();
    } catch {
      setIsCopied(false);
      if (copyResetTimeoutRef.current !== null) {
        window.clearTimeout(copyResetTimeoutRef.current);
        copyResetTimeoutRef.current = null;
      }
    }
  };

  return (
    <Button
      type="button"
      onClick={() => void handleCopyPageUrl()}
      className={cn("min-w-32 px-3 py-5 text-base font-semibold shadow-sm", className)}
      variant="outline"
    >
      {isCopied ? <CheckIcon className="size-4" /> : null}
      <span>{isCopied ? "Copied" : "Share page"}</span>
    </Button>
  );
}
