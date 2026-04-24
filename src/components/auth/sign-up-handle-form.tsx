"use client";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { useHandleAvailability } from "@/hooks/use-handle-availability";
import { normalizeHandle, validateHandle } from "@/lib/handles";
import { cn } from "@/lib/utils";
import { ChevronRightIcon, Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

export function SignUpHandleForm() {
  const router = useRouter();
  const [handle, setHandle] = React.useState("");
  const [isTouched, setIsTouched] = React.useState(false);

  const validationError = validateHandle(handle);
  const { availabilityError, isCheckingAvailability, isHandleAvailable, isHandleTaken } =
    useHandleAvailability(handle);
  const shouldShowValidationError = isTouched && !!validationError;
  const shouldShowAvailabilityState = isTouched && !!handle && !validationError;
  const errorMessage = shouldShowValidationError
    ? validationError
    : shouldShowAvailabilityState && availabilityError
      ? availabilityError
      : shouldShowAvailabilityState && isHandleTaken
        ? "This handle is already taken."
        : null;
  const showAvailableMessage = shouldShowAvailabilityState && isHandleAvailable;
  const isSubmitDisabled =
    !handle ||
    !!validationError ||
    !!availabilityError ||
    isCheckingAvailability ||
    isHandleTaken ||
    !isHandleAvailable;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsTouched(true);

    if (isSubmitDisabled) {
      return;
    }

    const searchParams = new URLSearchParams({ handle: normalizeHandle(handle) });
    router.push(`/sign-in?${searchParams.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <InputGroup className="h-16 rounded-full has-[[data-slot=input-group-control]:focus-visible]:border-input bg-background! transition-all">
        <InputGroupAddon className="pl-5">
          <InputGroupText className="text-lg">leeve.li /</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput
          autoFocus
          autoComplete="off"
          value={handle}
          onChange={(event) => {
            setHandle(normalizeHandle(event.target.value));
            setIsTouched(true);
          }}
          onBlur={() => setIsTouched(true)}
          aria-invalid={shouldShowValidationError || !!availabilityError || isHandleTaken}
          className="h-full px-0 text-lg!"
        />
        <InputGroupAddon align="inline-end" className="pr-3">
          <InputGroupButton
            type="submit"
            variant="default"
            size="icon-sm"
            className="size-12 rounded-full"
            disabled={isSubmitDisabled}
            aria-label="Continue to sign in"
          >
            {isCheckingAvailability ? (
              <Loader2Icon className="size-6 animate-spin" />
            ) : (
              <ChevronRightIcon className="size-6" />
            )}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      {errorMessage ? (
        <p className={cn("text-center text-sm lg:text-base", "text-destructive")}>{errorMessage}</p>
      ) : null}
    </form>
  );
}
