"use client";

import { CheckIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { appConfig } from "@/lib/config";
import { getProfileAppPath } from "@/lib/profile/app-paths";
import { cn } from "@/lib/utils";

type ProfileBentoPublicShareButtonProps = {
  className?: string;
  handle: string;
};

export function ProfileBentoPublicShareButton({
  className,
  handle,
}: ProfileBentoPublicShareButtonProps) {
  const [isCopied, setIsCopied] = useState(false);
  const href = `${appConfig.url}${getProfileAppPath(handle)}`;

  const handleCopyPageUrl = async () => {
    try {
      await navigator.clipboard.writeText(href);
      setIsCopied(true);
    } catch {
      setIsCopied(false);
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
