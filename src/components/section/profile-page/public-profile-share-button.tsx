"use client";

import { Button } from "@/components/ui/button";
import { CheckIcon, ShareIcon } from "lucide-react";
import { useEffect, useState } from "react";

export function PublicProfileShareButton() {
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!isCopied) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setIsCopied(false);
    }, 1800);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [isCopied]);

  const handleCopyCurrentUrl = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
  };

  return (
    <Button
      type="button"
      size="icon-lg"
      className="fixed right-4 bottom-4 z-50 size-12 rounded-full shadow-float border border-primary shadow-float!"
      aria-label={isCopied ? "Copied page URL" : "Copy page URL"}
      onClick={() => void handleCopyCurrentUrl()}
    >
      {isCopied ? (
        <CheckIcon className="size-5 stroke-3" />
      ) : (
        <ShareIcon className="size-5 stroke-3" />
      )}
    </Button>
  );
}
