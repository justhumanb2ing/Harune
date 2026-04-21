"use client";

import { authClient } from "@/lib/auth-client";
import { useEffect } from "react";
import { FaSpinner } from "react-icons/fa";

export default function SignOutPage() {
  useEffect(() => {
    const run = async () => {
      await Promise.allSettled([
        authClient.signOut(),
        fetch("/api/auth/impersonate", { method: "DELETE" }),
      ]);
      window.location.href = "/";
    };

    run();
  }, []);

  return (
    <div className="h-full flex flex-col items-center justify-center py-10 space-y-4">
      <FaSpinner className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Signing you out...</p>
    </div>
  );
}
