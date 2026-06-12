"use client";

import { CheckCircleIcon, SpinnerGapIcon, XCircleIcon } from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import {
  BubblesIcon,
  CircleFadingArrowUpIcon,
  Loader2Icon,
  MoveLeftIcon,
  TrashIcon,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { startTransition, ViewTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Textarea } from "@/components/ui/textarea";
import { useHandleAvailability } from "@/hooks/profile/use-handle-availability";
import { useProfileImageUpload } from "@/hooks/profile/use-profile-image-upload";
import { getCheckHandleAvailabilityQueryKey } from "@/lib/api/generated/http/handle-api/handle-api";
import { useUpdateProfilePage } from "@/lib/api/generated/http/profile-api/profile-api";
import { UpdateProfilePageBody as updateProfilePageBodySchema } from "@/lib/api/generated/zod/profile-api/profile-api.zod";
import { authClient } from "@/lib/auth/client";
import { normalizeHandle, validateHandle } from "@/lib/profile/handles";
import { PROFILE_IMAGE_ACCEPT } from "@/lib/profile/image-upload";
import {
  clearAuthenticatedAppQueries,
  invalidateAuthenticatedAppQueries,
} from "@/lib/react-query/app-cache";
import { cn } from "@/lib/utils";
import OnboardingAsideSection from "./onboarding-aside-section";

type OnboardingFormProps = {
  handle?: string;
};

type StepKey = "handle" | "profile";

const steps: Array<{
  key: StepKey;
  label: string;
  title: string;
  description: string;
}> = [
  {
    key: "handle",
    label: "Handle",
    title: "Claim your handle",
    description: "Pick a unique handle people can use to find you.",
  },
  {
    key: "profile",
    label: "Profile",
    title: "Fill out your profile",
    description: "Add your name, avatar, bio, role, and location.",
  },
];

const runOnboardingStepTransition = (direction: "forward" | "back", updateStep: () => void) => {
  document.documentElement.dataset.onboardingStepTransition = direction;
  startTransition(() => {
    updateStep();
  });
};

const normalizeOptionalField = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const getFailureMessage = (response: { status: number; data?: { error?: { message?: string } } }) =>
  response.data?.error?.message ?? "Something went wrong while creating your page.";

export function OnboardingForm({ handle }: OnboardingFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const profileImageUpload = useProfileImageUpload();
  const { mutateAsync: updateProfilePage } = useUpdateProfilePage({
    request: {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-store",
      },
    },
  });
  const [currentStep, setCurrentStep] = React.useState(0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSigningOut, setIsSigningOut] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pageHandle, setPageHandle] = React.useState(
    normalizeHandle(handle || searchParams.get("handle") || "")
  );
  const [name, setName] = React.useState("");
  const [role, setRole] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [bio, setBio] = React.useState("");

  const currentStepMeta = steps[currentStep];
  const hasHandleInput = !!pageHandle;
  const trimmedName = name.trim();
  const validationError = validateHandle(pageHandle);
  const { availabilityError, isCheckingAvailability, isHandleAvailable, isHandleTaken } =
    useHandleAvailability(pageHandle);
  const handleErrorMessage = hasHandleInput
    ? validationError
      ? validationError
      : availabilityError
        ? availabilityError
        : isHandleTaken
          ? "This handle is already taken."
          : null
    : null;
  const canTakeHandle =
    hasHandleInput &&
    !validationError &&
    !availabilityError &&
    !isCheckingAvailability &&
    !isHandleTaken &&
    isHandleAvailable;
  const showHandleStatus =
    hasHandleInput &&
    !validationError &&
    !availabilityError &&
    !isCheckingAvailability &&
    (isHandleAvailable || isHandleTaken);
  const handleStepErrorMessage = currentStep === 0 ? error || handleErrorMessage : null;
  const transitionToStep = React.useCallback(
    (nextStep: number, beforeStepChange?: () => void) => {
      const boundedNextStep = Math.min(Math.max(nextStep, 0), steps.length - 1);

      if (boundedNextStep === currentStep) {
        beforeStepChange?.();
        return;
      }

      runOnboardingStepTransition(boundedNextStep > currentStep ? "forward" : "back", () => {
        beforeStepChange?.();
        setCurrentStep(boundedNextStep);
      });
    },
    [currentStep]
  );

  const goToPreviousStep = () => {
    transitionToStep(currentStep - 1, () => setError(null));
  };

  const goToNextStep = () => {
    if (currentStep === 0) {
      if (validationError) {
        setError(validationError);
        return;
      }

      if (availabilityError) {
        setError(availabilityError);
        return;
      }

      if (isHandleTaken) {
        setError("This handle is already taken.");
        return;
      }

      if (isCheckingAvailability || !isHandleAvailable) {
        setError("Handle availability is still being checked.");
        return;
      }
    }

    transitionToStep(currentStep + 1, () => setError(null));
  };

  const handleSelectImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    try {
      setError(null);
      await profileImageUpload.selectFile(file);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Failed to select image.");
    }
  };

  const submitOnboarding = async () => {
    if (!trimmedName) {
      transitionToStep(1, () => setError("Name is required."));
      return;
    }

    if (validationError || availabilityError || isHandleTaken || !isHandleAvailable) {
      transitionToStep(0, () =>
        setError(
          validationError ||
            availabilityError ||
            (isHandleTaken ? "This handle is already taken." : "Please confirm your handle first.")
        )
      );
      return;
    }

    if (profileImageUpload.error) {
      transitionToStep(1, () => setError(profileImageUpload.error));
      return;
    }

    setIsSubmitting(true);
    setError(null);
    let uploadedImageUrl: string | null = null;

    try {
      uploadedImageUrl = await profileImageUpload.uploadSelectedFile("profile");
    } catch (uploadError) {
      transitionToStep(1, () => {
        setError(uploadError instanceof Error ? uploadError.message : "Failed to upload image.");
        setIsSubmitting(false);
      });
      return;
    }

    try {
      const updateBody = updateProfilePageBodySchema.parse({
        handle: pageHandle,
        image: uploadedImageUrl ?? undefined,
        name: trimmedName,
        role: normalizeOptionalField(role),
        location: normalizeOptionalField(location),
        bio: normalizeOptionalField(bio),
      });

      const response = await updateProfilePage({
        data: updateBody,
      });

      if (response.status !== 200) {
        const message = getFailureMessage(response);
        transitionToStep(1, () => setError(message));
        return;
      }

      await invalidateAuthenticatedAppQueries(queryClient);
      router.push(`/create/success?handle=${encodeURIComponent(response.data.page.handle)}`);
    } catch (submitError) {
      console.error("Failed to complete onboarding:", submitError);
      const apiError = submitError as Error & { status?: number };

      if (apiError.status === 409) {
        transitionToStep(0, () => setError(apiError.message || "This handle is already taken."));
        await queryClient.invalidateQueries({
          queryKey: getCheckHandleAvailabilityQueryKey({ handle: pageHandle }),
        });
        return;
      }

      const failParams = new URLSearchParams({ handle: pageHandle });
      if (apiError.message) {
        failParams.set("message", apiError.message);
      }

      router.push(`/create/fail?${failParams.toString()}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (currentStep < steps.length - 1) {
      goToNextStep();
      return;
    }

    await submitOnboarding();
  };

  const handleSignOut = async () => {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);
    setError(null);

    try {
      const result = await authClient.signOut();

      if (result.error) {
        console.error("Sign out failed:", result.error);
        setError("Failed to log out. Please try again.");
        setIsSigningOut(false);
        return;
      }

      clearAuthenticatedAppQueries(queryClient);
      router.push("/sign-in");
    } catch (signOutError) {
      console.error("Sign out failed:", signOutError);
      setError("Failed to log out. Please try again.");
      setIsSigningOut(false);
    }
  };

  return (
    <div className="relative flex h-full min-h-full w-full flex-row bg-background justify-center">
      <div className="relative flex h-full min-h-full w-full min-w-0 items-center justify-center gap-8 xl:gap-80 overflow-x-clip overflow-y-visible px-4 lg:px-6 2xl:px-8">
        <form
          onSubmit={handleComplete}
          className="flex h-full min-h-0 w-full min-w-0 flex-col gap-4 lg:w-[28rem] xl:w-[34rem] xl:flex-none xl:shrink-0"
        >
          <ViewTransition name="onboarding-step">
            <div className="min-h-0 w-full flex-1">
              <div className="flex h-full w-full flex-col justify-center gap-4 px-0 pb-6 xl:px-8">
                <div
                  className={cn("flex min-h-0 flex-col", currentStep === 1 ? "gap-8" : "gap-28")}
                >
                  <header className="shrink-0 space-y-4 pt-12">
                    {currentStep > 0 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-lg"
                        className="hover:bg-inherit"
                        onClick={goToPreviousStep}
                      >
                        <MoveLeftIcon className="size-8" />
                      </Button>
                    ) : null}
                    <h1 className="text-3xl lg:text-4xl font-bold">{currentStepMeta.title}</h1>
                    <p className="text-lg lg:text-xl text-muted-foreground">
                      {currentStepMeta.description}
                    </p>
                  </header>

                  {currentStep === 0 ? (
                    <div className="flex min-h-0 flex-1 flex-col justify-center space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-muted-foreground">
                          <p
                            className={cn(
                              "text-sm text-destructive transition-opacity",
                              handleStepErrorMessage ? "opacity-100" : "opacity-0"
                            )}
                            aria-live="polite"
                          >
                            {handleStepErrorMessage || "\u00a0"}
                          </p>
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            onClick={handleSignOut}
                            disabled={isSigningOut}
                          >
                            {isSigningOut ? "logging out..." : "or log out"}
                          </Button>
                        </div>

                        <InputGroup className="h-14 rounded-lg border-0 bg-secondary transition-all has-[[data-slot=input-group-control]:focus-visible]:border-secondary">
                          <InputGroupAddon className="pl-5">
                            <InputGroupText className="text-primary text-base!">
                              harune.me/
                            </InputGroupText>
                          </InputGroupAddon>
                          <InputGroupInput
                            id="handle"
                            autoComplete="off"
                            value={pageHandle}
                            onChange={(event) => {
                              setPageHandle(normalizeHandle(event.target.value));
                              if (error) {
                                setError(null);
                              }
                            }}
                            onBlur={() => {
                              if (error) {
                                setError(null);
                              }
                            }}
                            aria-invalid={
                              (hasHandleInput && !!validationError) ||
                              !!availabilityError ||
                              isHandleTaken ||
                              !!error
                            }
                            aria-label="Handle"
                            className="h-full pl-0.5! text-base!"
                            placeholder="your handle"
                            autoFocus
                          />
                          <InputGroupAddon align="inline-end" className="pr-4 rounded-full">
                            {isCheckingAvailability ? (
                              <SpinnerGapIcon
                                className="size-5 animate-spin"
                                aria-label="Checking"
                              />
                            ) : showHandleStatus ? (
                              isHandleTaken ? (
                                <XCircleIcon weight="fill" className="size-6 text-red-500" />
                              ) : (
                                <CheckCircleIcon weight="fill" className="size-6 text-green-500" />
                              )
                            ) : null}
                          </InputGroupAddon>
                        </InputGroup>
                        <Button
                          type="submit"
                          size="lg"
                          disabled={!canTakeHandle}
                          className={cn("h-14 w-full text-base font-bold")}
                        >
                          Take this handle
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {currentStep === 1 ? (
                    <aside className={cn("mt-12")}>
                      <div className="flex flex-col gap-48 overflow-hidden">
                        <div className="flex flex-col gap-8">
                          <div className="flex px-4">
                            <div className="group/profile-image relative">
                              <button
                                type="button"
                                className="relative flex size-36 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-secondary transition-colors hover:bg-input disabled:cursor-not-allowed disabled:opacity-70 xl:size-40"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={profileImageUpload.isUploading || isSubmitting}
                                aria-label="Upload profile image"
                              >
                                {profileImageUpload.previewUrl ? (
                                  // Object URLs and immediate local previews should render without Next image optimization.
                                  // biome-ignore lint/performance/noImgElement: This preview can be a blob URL.
                                  <img
                                    src={profileImageUpload.previewUrl}
                                    alt={trimmedName || "Selected profile image"}
                                    className="size-full object-cover"
                                  />
                                ) : (
                                  <span className="flex size-full flex-col items-center justify-center gap-2 rounded-full text-muted-foreground">
                                    {profileImageUpload.isUploading ? (
                                      <Loader2Icon className="size-6 animate-spin" />
                                    ) : (
                                      <CircleFadingArrowUpIcon className="size-6" />
                                    )}
                                    <span className="font-semibold text-lg">Avatar</span>
                                  </span>
                                )}
                              </button>
                              {profileImageUpload.previewUrl ? (
                                <Button
                                  type="button"
                                  size="icon-lg"
                                  className="pointer-events-none absolute top-1 right-1 z-10 size-10 rounded-full border-[0.5px] border-border bg-background text-black opacity-0 shadow-sm transition-opacity hover:bg-secondary group-hover/profile-image:pointer-events-auto group-hover/profile-image:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100"
                                  disabled={profileImageUpload.isUploading || isSubmitting}
                                  onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    profileImageUpload.clear();
                                  }}
                                  aria-label="Remove profile image"
                                >
                                  <TrashIcon className="size-5 stroke-3" />
                                </Button>
                              ) : null}
                            </div>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept={PROFILE_IMAGE_ACCEPT}
                              className="sr-only"
                              onChange={handleSelectImage}
                              disabled={profileImageUpload.isUploading || isSubmitting}
                            />
                          </div>

                          <div className="flex flex-col gap-3 p-4 pt-0">
                            <Textarea
                              id="name"
                              value={name}
                              onChange={(event) => {
                                setName(event.target.value);
                                if (error) {
                                  setError(null);
                                }
                              }}
                              placeholder="Your name"
                              aria-label="Your name"
                              autoComplete="off"
                              maxLength={100}
                              className="min-h-8 resize-none overflow-hidden rounded-none border-0 p-0! text-3xl! font-bold break-all focus-visible:ring-0 xl:text-[44px]! placeholder:text-neutral-400"
                            />

                            <Textarea
                              id="bio"
                              value={bio}
                              onChange={(event) => setBio(event.target.value)}
                              placeholder="Your bio"
                              aria-label="Bio"
                              className="min-h-8 resize-none overflow-hidden rounded-none border-0 p-0! text-lg! break-all focus-visible:ring-0 xl:text-xl! placeholder:text-neutral-400"
                            />

                            <div className="flex flex-col gap-2 text-neutral-500 mt-4">
                              <Input
                                id="role"
                                value={role}
                                onChange={(event) => setRole(event.target.value)}
                                placeholder="Role"
                                aria-label="Role"
                                autoComplete="off"
                                maxLength={100}
                                className="h-fit rounded-none border-0 px-0! text-base! focus-visible:ring-0"
                              />
                              <Input
                                id="location"
                                value={location}
                                onChange={(event) => setLocation(event.target.value)}
                                placeholder="Location"
                                aria-label="Location"
                                autoComplete="off"
                                maxLength={100}
                                className="h-fit rounded-none border-0 px-0! text-base! focus-visible:ring-0"
                              />
                            </div>
                          </div>
                        </div>

                        <Button
                          type="button"
                          size="lg"
                          className="h-14 w-full text-base font-bold"
                          onClick={() => void submitOnboarding()}
                          disabled={isSubmitting || profileImageUpload.isUploading || !trimmedName}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2Icon className="size-4 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <span>Create your page</span>
                              <BubblesIcon className="stroke-3" />
                            </>
                          )}
                        </Button>
                      </div>
                    </aside>
                  ) : null}

                  {currentStep !== 0 && handleErrorMessage ? (
                    <p className="text-center text-destructive">{handleErrorMessage}</p>
                  ) : null}

                  {currentStep !== 0 && error ? (
                    <p className="text-center text-destructive">{error}</p>
                  ) : null}
                </div>
              </div>
            </div>
          </ViewTransition>

          <div className="flex w-full items-center justify-center gap-2">
            {currentStep === 0 ? null : currentStep < steps.length - 1 ? (
              <Button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  goToNextStep();
                }}
                className={cn(
                  "h-12 w-full text-base font-bold opacity-100 transition-opacity",
                  trimmedName && !profileImageUpload.isUploading
                    ? "pointer-events-auto opacity-100"
                    : "pointer-events-none opacity-0"
                )}
              >
                Next
              </Button>
            ) : null}
          </div>
        </form>
        <OnboardingAsideSection />
      </div>
    </div>
  );
}
