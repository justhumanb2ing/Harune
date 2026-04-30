"use client";

import { initializePaddle, type Paddle } from "@paddle/paddle-js";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { env } from "@/env";
import { getProfileAppPath } from "@/lib/profile-page/app-paths";
import useUser from "@/lib/users/use-user";

export default function PaddleCheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [paddle, setPaddle] = useState<Paddle | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [showRetry, setShowRetry] = useState(false);
  const { profilePage, user } = useUser();
  const sectionHref = profilePage?.handle ? getProfileAppPath(profilePage.handle) : "/api/join";
  useEffect(() => {
    // Show retry button after 3 seconds
    const timer = setTimeout(() => {
      setShowRetry(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const openCheckout = useCallback(() => {
    if (!paddle) return;
    const transactionId = searchParams.get("transactionId") || searchParams.get("_ptxn");

    if (transactionId) {
      paddle.Checkout.open({
        transactionId: transactionId,
        settings: {
          displayMode: "overlay",
          theme: "light",
          locale: "en",
          allowLogout: false,
          showAddDiscounts: true,
          showAddTaxId: true,
          successUrl: `${window.location.origin}/subscribe/success?provider=paddle&transactionId=${transactionId}`,
        },
        customer: user?.paddleCustomerId
          ? { id: user?.paddleCustomerId }
          : user?.email
            ? { email: user?.email }
            : undefined,
      });
    }
  }, [paddle, user?.paddleCustomerId, user?.email, searchParams]);

  useEffect(() => {
    // Initialize Paddle
    const initPaddle = async () => {
      try {
        const paddleClientToken = env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;

        if (!paddleClientToken) {
          setError("Paddle client token is missing.");
          return;
        }

        if (
          env.NEXT_PUBLIC_PADDLE_ENV !== "production" &&
          env.NEXT_PUBLIC_PADDLE_ENV !== "sandbox"
        ) {
          console.warn(
            "NEXT_PUBLIC_PADDLE_ENV is not set to 'production' or 'sandbox'. Defaulting to 'sandbox'."
          );
        }

        const paddleInstance = await initializePaddle({
          environment: env.NEXT_PUBLIC_PADDLE_ENV === "production" ? "production" : "sandbox",
          token: paddleClientToken,
          eventCallback: (event) => {
            // checkout.closed open checkout again
            if (event.name === "checkout.closed") {
              setTimeout(() => {
                openCheckout();
              }, 1000);
            }
          },
        });
        setPaddle(paddleInstance);
      } catch (err) {
        console.error("Failed to initialize Paddle:", err);
        setError("Failed to load payment system.");
      }
    };

    if (!paddle) {
      initPaddle();
    }

    return () => {
      if (paddle) {
        paddle.Checkout.close();
        setPaddle(undefined);
      }
    };
  }, [paddle, openCheckout]);

  useEffect(() => {
    if (!paddle) return;

    if (user?.paddleCustomerId) {
      return;
    }

    // Get transactionId from query params
    // Support both transactionId and _ptxn (which Paddle might append)
    const transactionId = searchParams.get("transactionId") || searchParams.get("_ptxn");

    if (transactionId) {
      openCheckout();
    } else {
      setTimeout(() => {
        setError("Transaction ID is missing.");
      }, 1000);
    }
  }, [openCheckout, paddle, searchParams, user?.paddleCustomerId]);

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-destructive">{error}</p>
        <button
          type="button"
          onClick={() => router.push(sectionHref)}
          className="text-sm underline"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Opening secure checkout...</p>
        {showRetry && (
          <button type="button" onClick={openCheckout} className="text-sm underline cursor-pointer">
            Click here if checkout doesn&apos;t open
          </button>
        )}
      </div>
    </div>
  );
}
