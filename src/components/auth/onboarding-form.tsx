"use client";

import {
  AppleMusicIcon,
  GithubIcon,
  InstagramIcon,
  LogoBehanceIcon,
  LogoThreadsIcon,
  MailIcon,
  SoundcloudLogoSolidIcon,
  SpotifyIcon,
  TiktokIcon,
  XTwitterIcon,
} from "@/components/icon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Textarea } from "@/components/ui/textarea";
import { useHandleAvailability } from "@/hooks/use-handle-availability";
import {
  deleteUploadedProfileImage,
  useProfileImageUpload,
} from "@/hooks/use-profile-image-upload";
import { normalizeHandle, validateHandle } from "@/lib/handles";
import { PROFILE_IMAGE_ACCEPT } from "@/lib/profile-page/image-upload";
import { type ApiError, apiFetch } from "@/lib/react-query/fetcher";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleFadingArrowUpIcon,
  Loader2Icon,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import { FaLinkedinIn, FaYoutube } from "react-icons/fa6";

type OnboardingFormProps = {
  handle?: string;
  next?: string;
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
    title: "Choose your handle",
    description: "Choose the handle for your public page first.",
  },
  {
    key: "profile",
    label: "Profile",
    title: "Add your profile",
    description: "Name is required. Bio and image are optional.",
  },
  {
    key: "socials",
    label: "Links",
    title: "Add social links",
    description: "Optionally add links to the platforms you use.",
  },
];

const socialPlatforms: Array<{
  key: SocialLinkKey;
  label: string;
  placeholder: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}> = [
  { key: "x", label: "X", placeholder: "https://x.com/yourname", icon: XTwitterIcon },
  {
    key: "instagram",
    label: "Instagram",
    placeholder: "https://instagram.com/yourname",
    icon: InstagramIcon,
  },
  {
    key: "youtube",
    label: "YouTube",
    placeholder: "https://youtube.com/@yourname",
    icon: FaYoutube,
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    placeholder: "https://linkedin.com/in/yourname",
    icon: FaLinkedinIn,
  },
  { key: "github", label: "GitHub", placeholder: "https://github.com/yourname", icon: GithubIcon },
  {
    key: "threads",
    label: "Threads",
    placeholder: "https://www.threads.net/@yourname",
    icon: LogoThreadsIcon,
  },
  {
    key: "soundcloud",
    label: "SoundCloud",
    placeholder: "https://soundcloud.com/yourname",
    icon: SoundcloudLogoSolidIcon,
  },
  {
    key: "spotify",
    label: "Spotify",
    placeholder: "https://open.spotify.com/artist/yourid",
    icon: SpotifyIcon,
  },
  {
    key: "behance",
    label: "Behance",
    placeholder: "https://www.behance.net/yourname",
    icon: LogoBehanceIcon,
  },
  {
    key: "tiktok",
    label: "TikTok",
    placeholder: "https://www.tiktok.com/@yourname",
    icon: TiktokIcon,
  },
  { key: "mail", label: "Email", placeholder: "example@domain.com", icon: MailIcon },
  {
    key: "apple_music",
    label: "Apple Music",
    placeholder: "https://music.apple.com/profile/yourname",
    icon: AppleMusicIcon,
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

const ONBOARDING_DRAFT_KEY = "leeve:onboarding-draft";

type OnboardingDraft = {
  bio: string;
  currentStep: number;
  name: string;
  pageHandle: string;
  socialLinks: SocialLinksState;
};

const isValidDraft = (value: unknown): value is OnboardingDraft => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const draft = value as Partial<OnboardingDraft>;
  return (
    typeof draft.bio === "string" &&
    typeof draft.currentStep === "number" &&
    typeof draft.name === "string" &&
    typeof draft.pageHandle === "string" &&
    !!draft.socialLinks &&
    typeof draft.socialLinks === "object"
  );
};

const getSafeNextPath = (value?: string) => {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/section";
  }

  return value;
};

export function OnboardingForm({ handle, next }: OnboardingFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const profileImageUpload = useProfileImageUpload();
  const [currentStep, setCurrentStep] = React.useState(0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pageHandle, setPageHandle] = React.useState(
    normalizeHandle(handle || searchParams.get("handle") || "")
  );
  const [name, setName] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [socialLinks, setSocialLinks] = React.useState<SocialLinksState>(createInitialSocialLinks);
  const [hasLoadedDraft, setHasLoadedDraft] = React.useState(false);

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
  const showAvailableMessage = hasHandleInput && !handleErrorMessage && isHandleAvailable && !error;
  const hasDraftableInput =
    !!pageHandle ||
    !!trimmedName ||
    !!bio.trim() ||
    Object.values(socialLinks).some((value) => value.trim().length > 0);

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

  const goToPreviousStep = () => {
    setError(null);
    setCurrentStep((step) => Math.max(step - 1, 0));
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

    setError(null);
    setCurrentStep((step) => Math.min(step + 1, steps.length - 1));
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

  const submitOnboarding = async () => {
    if (!trimmedName) {
      setCurrentStep(1);
      setError("Name is required.");
      return;
    }

    if (validationError || availabilityError || isHandleTaken || !isHandleAvailable) {
      setCurrentStep(0);
      setError(
        validationError ||
          availabilityError ||
          (isHandleTaken ? "This handle is already taken." : "Please confirm your handle first.")
      );
      return;
    }

    if (profileImageUpload.error) {
      setCurrentStep(1);
      setError(profileImageUpload.error);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    let uploadedImageUrl: string | null = null;

    try {
      uploadedImageUrl = await profileImageUpload.uploadSelectedFile();
    } catch (uploadError) {
      setCurrentStep(1);
      setError(uploadError instanceof Error ? uploadError.message : "Failed to upload image.");
      setIsSubmitting(false);
      return;
    }

    try {
      await apiFetch<{ success: true }>("/api/app/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          handle: pageHandle,
          image: uploadedImageUrl || undefined,
          name: trimmedName,
          bio,
          socialLinks,
        }),
      });
      window.localStorage.removeItem(ONBOARDING_DRAFT_KEY);
      await queryClient.invalidateQueries({ queryKey: queryKeys.app.me() });
      const successParams = new URLSearchParams({ handle: pageHandle });
      const nextPath = getSafeNextPath(next);

      if (nextPath !== "/section") {
        successParams.set("next", nextPath);
      }

      router.push(`/onboarding/success?${successParams.toString()}`);
    } catch (submitError) {
      if (uploadedImageUrl) {
        try {
          await deleteUploadedProfileImage(uploadedImageUrl);
        } catch (rollbackError) {
          console.error("Failed to rollback uploaded onboarding profile image:", rollbackError);
        }
      }

      console.error("Failed to complete onboarding:", submitError);
      const apiError = submitError as ApiError;
      if (apiError.status === 409) {
        setCurrentStep(0);
        setError(apiError.message || "This handle is already taken.");
        await queryClient.invalidateQueries({
          queryKey: queryKeys.handles.availability(pageHandle),
        });
        return;
      }

      const failParams = new URLSearchParams({ handle: pageHandle });
      if (apiError.message) {
        failParams.set("message", apiError.message);
      }

      router.push(`/onboarding/fail?${failParams.toString()}`);
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

  React.useEffect(() => {
    if (hasLoadedDraft) {
      return;
    }

    setHasLoadedDraft(true);

    try {
      const rawDraft = window.localStorage.getItem(ONBOARDING_DRAFT_KEY);
      if (!rawDraft) {
        return;
      }

      const parsedDraft: unknown = JSON.parse(rawDraft);
      if (!isValidDraft(parsedDraft)) {
        window.localStorage.removeItem(ONBOARDING_DRAFT_KEY);
        return;
      }

      const normalizedHandle = normalizeHandle(handle || parsedDraft.pageHandle);
      setPageHandle(normalizedHandle);
      setName(parsedDraft.name);
      setBio(parsedDraft.bio);
      setSocialLinks({ ...createInitialSocialLinks(), ...parsedDraft.socialLinks });
      setCurrentStep(Math.min(Math.max(parsedDraft.currentStep, 0), steps.length - 1));
    } catch {
      window.localStorage.removeItem(ONBOARDING_DRAFT_KEY);
    }
  }, [handle, hasLoadedDraft]);

  React.useEffect(() => {
    if (!hasLoadedDraft || isSubmitting) {
      return;
    }

    if (!hasDraftableInput) {
      window.localStorage.removeItem(ONBOARDING_DRAFT_KEY);
      return;
    }

    const draft: OnboardingDraft = {
      bio,
      currentStep,
      name,
      pageHandle,
      socialLinks,
    };

    window.localStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify(draft));
  }, [
    bio,
    currentStep,
    hasDraftableInput,
    hasLoadedDraft,
    isSubmitting,
    name,
    pageHandle,
    socialLinks,
  ]);

  React.useEffect(() => {
    if (!hasDraftableInput || isSubmitting) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasDraftableInput, isSubmitting]);

  return (
    <div className="relative h-full min-h-full w-full bg-background">
      {currentStep > 0 ? (
        <Button
          type="button"
          variant="default"
          size="lg"
          className="absolute top-3 left-3 rounded-full uppercase"
          onClick={goToPreviousStep}
        >
          <ChevronLeftIcon className="size-5" />
          <span>Prev</span>
        </Button>
      ) : null}
      <div className="mx-auto flex h-full max-w-md flex-col gap-4 py-6">
        <header>
          <h2 className="text-sm uppercase text-center font-medium">{currentStepMeta.label}</h2>
        </header>

        <div className="flex-1 px-8 pb-8">
          <form onSubmit={handleComplete} className="flex h-full flex-col gap-6">
            <div className="grow space-y-6">
              {currentStep === 0 ? (
                <div className="space-y-4 h-full flex flex-col justify-center">
                  <div className="space-y-2">
                    <InputGroup className="h-16 rounded-xl has-[[data-slot=input-group-control]:focus-visible]:border-input bg-input! transition-all border-0">
                      <InputGroupAddon className="pl-5">
                        <InputGroupText className="text-lg">leeve.li /</InputGroupText>
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
                        className="h-full px-0 text-lg!"
                        placeholder="your_handle"
                        autoFocus
                      />
                      <InputGroupAddon align="inline-end" className="pr-3">
                        <InputGroupButton
                          type="submit"
                          variant="default"
                          size="icon-sm"
                          className="size-12 rounded-full"
                          disabled={
                            !pageHandle ||
                            !!validationError ||
                            !!availabilityError ||
                            isCheckingAvailability ||
                            isHandleTaken ||
                            !isHandleAvailable
                          }
                          aria-label="Continue"
                        >
                          {isCheckingAvailability ? (
                            <Loader2Icon className="size-6 animate-spin" />
                          ) : (
                            <ChevronRightIcon className="size-6" />
                          )}
                        </InputGroupButton>
                      </InputGroupAddon>
                    </InputGroup>
                  </div>
                </div>
              ) : null}

              {currentStep === 1 ? (
                <div className="relative mt-20 min-h-[52rem] overflow-hidden rounded-t-[3rem] p-4 pt-10">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 scale-105 bg-[linear-gradient(to_bottom,white_0%,white_72%,color-mix(in_oklab,var(--secondary)_55%,white)_100%)] blur-2xl"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-white/35"
                  />

                  <div className="relative z-10 space-y-5">
                    <div className="flex items-center justify-center">
                      <div className="space-y-3">
                        <button
                          type="button"
                          className="relative flex size-40 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-secondary transition-colors hover:bg-input disabled:cursor-not-allowed disabled:opacity-70"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={profileImageUpload.isUploading || isSubmitting}
                        >
                          {profileImageUpload.previewUrl ? (
                            <Avatar className="size-full">
                              <AvatarImage
                                src={profileImageUpload.previewUrl}
                                alt={
                                  profileImageUpload.selectedFileName ?? "Selected profile image"
                                }
                                className="object-cover"
                              />
                              <AvatarFallback>{getInitials()}</AvatarFallback>
                            </Avatar>
                          ) : (
                            <span className="flex size-10 items-center justify-center">
                              <CircleFadingArrowUpIcon className="size-6 text-muted-foreground" />
                            </span>
                          )}
                          {profileImageUpload.isUploading ? (
                            <span className="absolute inset-0 flex items-center justify-center bg-black/35">
                              <Loader2Icon className="size-6 animate-spin text-white" />
                            </span>
                          ) : null}
                        </button>
                        <input
                          ref={fileInputRef}
                          id="image-upload"
                          type="file"
                          accept={PROFILE_IMAGE_ACCEPT}
                          className="sr-only"
                          onChange={handleSelectImage}
                          disabled={profileImageUpload.isUploading || isSubmitting}
                        />
                        {profileImageUpload.error ? (
                          <p className="max-w-48 text-center text-destructive text-sm">
                            {profileImageUpload.error}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="space-y-2">
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
                        className="h-16 border-0 bg-secondary text-center hover:bg-input"
                      />
                    </div>

                    <div className="space-y-2">
                      <Textarea
                        id="bio"
                        value={bio}
                        onChange={(event) => setBio(event.target.value)}
                        placeholder="Bio"
                        aria-label="Bio"
                        className="h-40 resize-none border-0 bg-secondary p-4 hover:bg-input"
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              {currentStep === 2 ? (
                <div className="space-y-3 mt-20">
                  {socialPlatforms.map((platform) => (
                    <div key={platform.key} className="space-y-2">
                      <InputGroup className="h-16 rounded-xl border-0 bg-background transition-all">
                        <InputGroupAddon className="pl-5">
                          <InputGroupText>
                            <platform.icon className="size-6 text-black" aria-hidden="true" />
                          </InputGroupText>
                        </InputGroupAddon>
                        <InputGroupInput
                          id={platform.key}
                          value={socialLinks[platform.key]}
                          onChange={(event) => {
                            setSocialLinks((prev) => ({
                              ...prev,
                              [platform.key]: event.target.value,
                            }));
                          }}
                          placeholder={"Add handle or URL"}
                          aria-label={platform.label}
                          className="h-full px-0 pl-4!"
                        />
                      </InputGroup>
                    </div>
                  ))}
                </div>
              ) : null}

              {handleErrorMessage ? (
                <p className="text-destructive text-center">{handleErrorMessage}</p>
              ) : null}

              {error ? <p className="text-destructive text-center">{error}</p> : null}
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex w-full items-center justify-center gap-2">
                {currentStep === 0 ? null : currentStep < steps.length - 1 ? (
                  <Button
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      goToNextStep();
                    }}
                    size="icon-lg"
                    className="size-11 rounded-full"
                    disabled={!trimmedName || profileImageUpload.isUploading}
                  >
                    <ChevronRightIcon className="size-6" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="lg"
                    className="px-8 py-6 text-base"
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
                        Create page
                        <ArrowRightIcon className="size-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
