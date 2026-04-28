"use client";

import { SocialPlatformIcon } from "@/components/icon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Textarea } from "@/components/ui/textarea";
import { useHandleAvailability } from "@/hooks/use-handle-availability";
import {
  deleteUploadedProfileImage,
  useProfileImageUpload,
} from "@/hooks/use-profile-image-upload";
import { authClient } from "@/lib/auth-client";
import { normalizeHandle, validateHandle } from "@/lib/handles";
import { PROFILE_IMAGE_ACCEPT } from "@/lib/profile-page/image-upload";
import {
  clearAuthenticatedAppQueries,
  invalidateAuthenticatedAppQueries,
} from "@/lib/react-query/app-cache";
import { type ApiError, apiFetch } from "@/lib/react-query/fetcher";
import { queryKeys } from "@/lib/react-query/query-keys";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { BubblesIcon, CircleFadingArrowUpIcon, DotIcon, Loader2Icon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { ViewTransition, startTransition } from "react";

type OnboardingFormProps = {
  handle?: string;
};

type StepKey = "handle" | "profile" | "socials";

type SocialLinkKey =
  | "x"
  | "instagram"
  | "youtube"
  | "linkedin"
  | "github"
  | "threads"
  | "soundcloud"
  | "spotify"
  | "behance"
  | "tiktok"
  | "mail"
  | "apple_music";

type SocialLinksState = Record<SocialLinkKey, string>;

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
    description: "Add your name, avatar, background, and a short bio.",
  },
  {
    key: "socials",
    label: "Links",
    title: "Connect your socials",
    description: "Add the links you want to share on your page.",
  },
];

const socialPlatforms: Array<{
  key: SocialLinkKey;
  label: string;
  placeholder: string;
}> = [
  {
    key: "x",
    label: "X",
    placeholder: "https://x.com/yourname",
  },
  {
    key: "instagram",
    label: "Instagram",
    placeholder: "https://instagram.com/yourname",
  },
  {
    key: "youtube",
    label: "YouTube",
    placeholder: "https://youtube.com/@yourname",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    placeholder: "https://linkedin.com/in/yourname",
  },
  {
    key: "github",
    label: "GitHub",
    placeholder: "https://github.com/yourname",
  },
  {
    key: "threads",
    label: "Threads",
    placeholder: "https://www.threads.net/@yourname",
  },
  {
    key: "soundcloud",
    label: "SoundCloud",
    placeholder: "https://soundcloud.com/yourname",
  },
  {
    key: "spotify",
    label: "Spotify",
    placeholder: "https://open.spotify.com/artist/yourid",
  },
  {
    key: "behance",
    label: "Behance",
    placeholder: "https://www.behance.net/yourname",
  },
  {
    key: "tiktok",
    label: "TikTok",
    placeholder: "https://www.tiktok.com/@yourname",
  },
  {
    key: "mail",
    label: "Email",
    placeholder: "example@domain.com",
  },
  {
    key: "apple_music",
    label: "Apple Music",
    placeholder: "https://music.apple.com/profile/yourname",
  },
];

const createInitialSocialLinks = (): SocialLinksState => ({
  x: "",
  instagram: "",
  youtube: "",
  linkedin: "",
  github: "",
  threads: "",
  soundcloud: "",
  spotify: "",
  behance: "",
  tiktok: "",
  mail: "",
  apple_music: "",
});

const runOnboardingStepTransition = (direction: "forward" | "back", updateStep: () => void) => {
  document.documentElement.dataset.onboardingStepTransition = direction;
  startTransition(() => {
    updateStep();
  });
};

export function OnboardingForm({ handle }: OnboardingFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const backgroundImageInputRef = React.useRef<HTMLInputElement | null>(null);
  const profileImageUpload = useProfileImageUpload();
  const backgroundImageUpload = useProfileImageUpload();
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
  const [socialLinks, setSocialLinks] = React.useState<SocialLinksState>(createInitialSocialLinks);

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
  const getInitials = React.useCallback(() => {
    if (!trimmedName) {
      return "N";
    }

    return trimmedName
      .split(/\s+/)
      .map((value) => value[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [trimmedName]);

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

    if (currentStep === 1 && !trimmedName) {
      setError("Name is required.");
      return;
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
      profileImageUpload.selectFile(file);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Failed to select image.");
    }
  };

  const handleSelectBackgroundImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    try {
      setError(null);
      backgroundImageUpload.selectFile(file);
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

    if (backgroundImageUpload.error) {
      transitionToStep(1, () => setError(backgroundImageUpload.error));
      return;
    }

    setIsSubmitting(true);
    setError(null);
    let uploadedImageUrl: string | null = null;
    let uploadedBackgroundImageUrl: string | null = null;

    try {
      uploadedImageUrl = await profileImageUpload.uploadSelectedFile("profile");
      uploadedBackgroundImageUrl = await backgroundImageUpload.uploadSelectedFile("background");
    } catch (uploadError) {
      if (uploadedImageUrl) {
        try {
          await deleteUploadedProfileImage(uploadedImageUrl);
        } catch (rollbackError) {
          console.error("Failed to rollback uploaded onboarding profile image:", rollbackError);
        }
      }

      transitionToStep(1, () => {
        setError(uploadError instanceof Error ? uploadError.message : "Failed to upload image.");
        setIsSubmitting(false);
      });
      return;
    }

    try {
      await apiFetch<{ success: true }>("/api/app/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          handle: pageHandle,
          image: uploadedImageUrl || undefined,
          backgroundImage: uploadedBackgroundImageUrl || undefined,
          name: trimmedName,
          role,
          location,
          bio,
          socialLinks,
        }),
      });
      await invalidateAuthenticatedAppQueries(queryClient);
      router.push("/create/success");
    } catch (submitError) {
      if (uploadedImageUrl) {
        try {
          await deleteUploadedProfileImage(uploadedImageUrl);
        } catch (rollbackError) {
          console.error("Failed to rollback uploaded onboarding profile image:", rollbackError);
        }
      }

      if (uploadedBackgroundImageUrl) {
        try {
          await deleteUploadedProfileImage(uploadedBackgroundImageUrl);
        } catch (rollbackError) {
          console.error("Failed to rollback uploaded onboarding background image:", rollbackError);
        }
      }

      console.error("Failed to complete onboarding:", submitError);
      const apiError = submitError as ApiError;
      if (apiError.status === 409) {
        transitionToStep(0, () => setError(apiError.message || "This handle is already taken."));
        await queryClient.invalidateQueries({
          queryKey: queryKeys.handles.availability(pageHandle),
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
      router.refresh();
    } catch (signOutError) {
      console.error("Sign out failed:", signOutError);
      setError("Failed to log out. Please try again.");
      setIsSigningOut(false);
    }
  };

  return (
    <div className="relative flex h-full min-h-full w-full flex-row bg-background">
      <div className="relative h-full flex-1 overflow-hidden">
        <form onSubmit={handleComplete} className="flex h-full min-h-0 w-full flex-col gap-4">
          <ViewTransition name="onboarding-step">
            <div className="min-h-0 flex-1 w-full">
              <div className="mx-auto flex h-full max-w-md flex-col gap-4 px-8 pb-6">
                <div className="flex min-h-0 flex-1 flex-col gap-4">
                  <header className="shrink-0 space-y-2 pt-12">
                    <h1 className="text-3xl font-semibold tracking-tight">
                      {currentStepMeta.title}
                    </h1>
                    <p className="text-sm text-muted-foreground">{currentStepMeta.description}</p>
                  </header>

                  {currentStep === 0 ? (
                    <div className="flex min-h-0 flex-1 flex-col justify-center space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-end text-muted-foreground">
                          <Button
                            type="button"
                            variant="link"
                            size="xs"
                            onClick={handleSignOut}
                            disabled={isSigningOut}
                          >
                            {isSigningOut ? "logging out..." : "or log out"}
                          </Button>
                        </div>

                        <InputGroup className="h-12 rounded-xl has-[[data-slot=input-group-control]:focus-visible]:border-secondary bg-secondary! transition-all border-0">
                          <InputGroupAddon className="pl-5">
                            <InputGroupText className="text-primary">harune.me/</InputGroupText>
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
                            className="h-full pl-0.5!"
                            placeholder="your handle"
                            autoFocus
                          />
                          <InputGroupAddon align="inline-end" className="pr-3">
                            {isCheckingAvailability ? (
                              <Loader2Icon className="size-5 animate-spin" aria-label="Checking" />
                            ) : showHandleStatus ? (
                              <DotIcon
                                className={
                                  isHandleTaken
                                    ? "size-5 stroke-5 text-red-500"
                                    : "size-5 stroke-5 text-green-500"
                                }
                                aria-label={
                                  isHandleTaken ? "Handle unavailable" : "Handle available"
                                }
                              />
                            ) : null}
                          </InputGroupAddon>
                        </InputGroup>
                        <p
                          className={cn(
                            "min-h-5 text-sm text-destructive transition-opacity",
                            handleStepErrorMessage ? "opacity-100" : "opacity-0"
                          )}
                          aria-live="polite"
                        >
                          {handleStepErrorMessage || "\u00a0"}
                        </p>
                        <Button
                          type="submit"
                          size="lg"
                          className={cn(
                            "h-12 w-full border-indigo-400 bg-indigo-400 text-base font-bold opacity-100 shadow-lg transition-opacity hover:bg-indigo-500",
                            canTakeHandle
                              ? "pointer-events-auto opacity-100"
                              : "pointer-events-none opacity-0"
                          )}
                        >
                          Take this handle
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  {currentStep === 1 ? (
                    <div className="relative flex min-h-0 flex-1 flex-col justify-center rounded-t-[2rem] bg-background">
                      <div className="relative z-10 flex min-h-[46rem] flex-col rounded-t-[2rem] bg-background">
                        <div className="flex flex-col gap-2 rounded-t-[3rem] bg-background shadow-brand-small">
                          <div className="relative mb-16">
                            <button
                              type="button"
                              className="relative flex h-52 w-full cursor-pointer items-center justify-center overflow-hidden rounded-t-[2rem] border-b border-border bg-secondary transition-colors hover:bg-input disabled:cursor-not-allowed disabled:opacity-70"
                              onClick={() => backgroundImageInputRef.current?.click()}
                              disabled={backgroundImageUpload.isUploading || isSubmitting}
                              aria-label="Upload background image"
                            >
                              {backgroundImageUpload.previewUrl ? (
                                <img
                                  src={backgroundImageUpload.previewUrl}
                                  alt=""
                                  className="size-full object-cover"
                                />
                              ) : null}
                              {backgroundImageUpload.isUploading ? (
                                <span className="absolute inset-0 flex items-center justify-center bg-black/35">
                                  <Loader2Icon className="size-6 animate-spin text-white" />
                                </span>
                              ) : null}
                            </button>
                            <input
                              ref={backgroundImageInputRef}
                              id="background-image-upload"
                              type="file"
                              accept={PROFILE_IMAGE_ACCEPT}
                              className="sr-only"
                              onChange={handleSelectBackgroundImage}
                              disabled={backgroundImageUpload.isUploading || isSubmitting}
                            />
                            <div className="absolute left-1/2 bottom-0 z-10 -translate-x-1/2 translate-y-1/2">
                              <button
                                type="button"
                                className="relative flex size-32 cursor-pointer items-center justify-center overflow-hidden rounded-full border bg-secondary transition-colors hover:bg-input disabled:cursor-not-allowed disabled:opacity-70"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={profileImageUpload.isUploading || isSubmitting}
                                aria-label="Upload profile image"
                              >
                                {profileImageUpload.previewUrl ? (
                                  <Avatar className="size-full">
                                    <AvatarImage
                                      src={profileImageUpload.previewUrl}
                                      alt={
                                        profileImageUpload.selectedFileName ??
                                        "Selected profile image"
                                      }
                                      className="object-cover"
                                    />
                                    <AvatarFallback />
                                  </Avatar>
                                ) : (
                                  <span className="flex min-w-24 flex-col items-center justify-center gap-2 text-muted-foreground">
                                    <CircleFadingArrowUpIcon className="size-6 text-muted-foreground" />
                                    <span className="text-xs font-semibold">Avatar</span>
                                  </span>
                                )}
                                {profileImageUpload.isUploading ? (
                                  <span className="absolute inset-0 flex items-center justify-center bg-black/35">
                                    <Loader2Icon className="size-6 animate-spin text-white" />
                                  </span>
                                ) : null}
                              </button>
                            </div>
                            <input
                              ref={fileInputRef}
                              id="image-upload"
                              type="file"
                              accept={PROFILE_IMAGE_ACCEPT}
                              className="sr-only"
                              onChange={handleSelectImage}
                              disabled={profileImageUpload.isUploading || isSubmitting}
                            />
                          </div>
                          {profileImageUpload.error || backgroundImageUpload.error ? (
                            <p className="text-center text-destructive text-sm">
                              {profileImageUpload.error || backgroundImageUpload.error}
                            </p>
                          ) : null}

                          <div className="flex flex-col gap-2 p-4">
                            <div>
                              <Input
                                id="name"
                                value={name}
                                onChange={(event) => {
                                  setName(event.target.value);
                                  if (error) {
                                    setError(null);
                                  }
                                }}
                                placeholder="Name"
                                aria-label="Name"
                                aria-invalid={!!error && !trimmedName}
                                autoComplete="off"
                                className="h-12 border-0 bg-secondary text-center hover:bg-input"
                              />
                            </div>

                            <div>
                              <Textarea
                                id="bio"
                                value={bio}
                                onChange={(event) => setBio(event.target.value)}
                                placeholder="Bio"
                                aria-label="Bio"
                                className="h-24 resize-none border-0 bg-secondary p-4 hover:bg-input"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                id="role"
                                value={role}
                                onChange={(event) => setRole(event.target.value)}
                                placeholder="Role"
                                aria-label="Role"
                                autoComplete="off"
                                maxLength={100}
                                className="h-12 border-0 bg-secondary text-center hover:bg-input"
                              />
                              <Input
                                id="location"
                                value={location}
                                onChange={(event) => setLocation(event.target.value)}
                                placeholder="Location"
                                aria-label="Location"
                                autoComplete="off"
                                maxLength={100}
                                className="h-12 border-0 bg-secondary text-center hover:bg-input"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 bg-background" />
                      </div>
                    </div>
                  ) : null}

                  {currentStep === 2 ? (
                    <div className="relative flex min-h-0 flex-1 flex-col justify-center rounded-t-[2rem] bg-background">
                      <div className="relative z-10 flex min-h-[46rem] flex-col rounded-t-[2rem] bg-background">
                        <div className="flex flex-col gap-3 rounded-t-[3rem] bg-background p-4 pt-18 shadow-brand-small">
                          {socialPlatforms.map((platform) => (
                            <div key={platform.key} className="flex items-center gap-3">
                              <SocialPlatformIcon
                                platform={platform.key}
                                variant="color"
                                className="size-10 shrink-0"
                                aria-hidden="true"
                              />
                              <InputGroup className="h-11 flex-1 rounded-md border-0 bg-secondary">
                                <InputGroupInput
                                  id={platform.key}
                                  value={socialLinks[platform.key]}
                                  onChange={(event) => {
                                    setSocialLinks((prev) => ({
                                      ...prev,
                                      [platform.key]: event.target.value,
                                    }));
                                  }}
                                  placeholder={
                                    platform.key === "mail" ? platform.placeholder : "Add URL"
                                  }
                                  aria-label={platform.label}
                                  className="h-full px-4!"
                                />
                              </InputGroup>
                            </div>
                          ))}
                        </div>
                        <div className="relative z-10 -mt-3 min-h-20 flex-1 bg-background" />
                      </div>
                    </div>
                  ) : null}

                  {currentStep !== 0 && handleErrorMessage ? (
                    <p className="text-destructive text-center">{handleErrorMessage}</p>
                  ) : null}

                  {currentStep !== 0 && error ? (
                    <p className="text-destructive text-center">{error}</p>
                  ) : null}
                </div>
              </div>
            </div>
          </ViewTransition>

          <div className="mx-auto flex w-full max-w-md shrink-0 flex-col items-center justify-between gap-2 px-8 pb-6">
            <div className="flex w-full items-center justify-center gap-2">
              {currentStep === 0 ? null : currentStep < steps.length - 1 ? (
                <Button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    goToNextStep();
                  }}
                  className={cn(
                    "h-12 w-full bg-indigo-400 border-indigo-400 text-base font-bold opacity-100 shadow-lg transition-opacity hover:bg-indigo-500",
                    trimmedName && !profileImageUpload.isUploading
                      ? "pointer-events-auto opacity-100"
                      : "pointer-events-none opacity-0"
                  )}
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="button"
                  size="lg"
                  className="h-12 text-base w-full bg-indigo-400 border-indigo-400 font-bold hover:bg-indigo-500 shadow-lg"
                  onClick={() => void submitOnboarding()}
                  disabled={isSubmitting || profileImageUpload.isUploading}
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
              )}
            </div>
            {currentStep > 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="lg"
                className="font-bold w-full h-12 text-muted-foreground"
                onClick={goToPreviousStep}
              >
                <span>Back</span>
              </Button>
            ) : null}
          </div>
        </form>
      </div>
      <section className="hidden h-full flex-1 lg:block">
        <div className="h-full">
          <img
            src="https://images.unsplash.com/photo-1713508298272-7d0db139dc54?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
            alt="img"
            className="h-full w-full object-cover"
          />
        </div>
      </section>
    </div>
  );
}
