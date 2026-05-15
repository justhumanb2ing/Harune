"use client";

import { CheckIcon, XIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import Cropper, {
  type Area,
  getInitialCropFromCroppedAreaPixels,
  type MediaSize,
} from "react-easy-crop";
import { Button } from "@/components/ui/button";
import type { ProfileImageCrop } from "@/lib/profile/types";
import { cn } from "@/lib/utils";

type ProfileImageCropSurfaceProps = {
  imageSrc: string | null;
  initialCroppedAreaPixels?: Area | null;
  onApplied: (result: { imageCrop: ProfileImageCrop }) => Promise<void> | void;
  onClose: () => void;
};

const INITIAL_CROP = { x: 0, y: 0 };
const INITIAL_ZOOM = 1;
const PROFILE_CROP_SIZE_SMALL = 128;
const PROFILE_CROP_SIZE_XL = 176;
const MIN_ZOOM = 1;
const MAX_ZOOM = 1;
const SURFACE_CLASS_NAME =
  "pointer-events-auto absolute left-1/2 top-1/2 z-40 -translate-x-1/2 -translate-y-1/2";

export function ProfileImageCropSurface({
  imageSrc,
  initialCroppedAreaPixels,
  onApplied,
  onClose,
}: ProfileImageCropSurfaceProps) {
  const [crop, setCrop] = useState(INITIAL_CROP);
  const [zoom, setZoom] = useState(INITIAL_ZOOM);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cropKey, setCropKey] = useState(0);
  const [displaySize, setDisplaySize] = useState(PROFILE_CROP_SIZE_SMALL);
  const [mediaSize, setMediaSize] = useState<MediaSize | null>(null);
  const [mediaAspect, setMediaAspect] = useState(1);
  const [viewportSize, setViewportSize] = useState({ height: 0, width: 0 });
  const initialCropAppliedRef = useRef(false);

  useEffect(() => {
    const updateDisplaySize = () => {
      const nextSize = window.innerWidth >= 1280 ? PROFILE_CROP_SIZE_XL : PROFILE_CROP_SIZE_SMALL;
      setDisplaySize(nextSize);
    };
    const updateViewportSize = () => {
      setViewportSize({ height: window.innerHeight, width: window.innerWidth });
    };

    updateDisplaySize();
    updateViewportSize();

    window.addEventListener("resize", updateDisplaySize);
    window.addEventListener("resize", updateViewportSize);

    return () => {
      window.removeEventListener("resize", updateDisplaySize);
      window.removeEventListener("resize", updateViewportSize);
    };
  }, []);

  useEffect(() => {
    setCrop(INITIAL_CROP);
    setZoom(INITIAL_ZOOM);
    setCroppedAreaPixels(null);
    setIsSubmitting(false);
    setMediaSize(null);
    setMediaAspect(1);
    initialCropAppliedRef.current = false;
    setCropKey((current) => current + 1);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSubmitting, onClose]);

  const hasImage = Boolean(imageSrc);
  const canApply = Boolean(hasImage && croppedAreaPixels);
  const cropAreaSize = {
    width: displaySize,
    height: displaySize,
  };
  const maxPortraitContainerHeight = Math.round(displaySize * 1.3);
  const containerSize =
    mediaAspect >= 1
      ? {
          width: Math.round(displaySize * mediaAspect),
          height: displaySize,
        }
      : {
          width: displaySize,
          height: Math.min(Math.round(displaySize / mediaAspect), maxPortraitContainerHeight),
        };
  const viewportHorizontalPadding = 32;
  const viewportVerticalPadding = 88;
  const widthScale =
    viewportSize.width > 0
      ? (viewportSize.width - viewportHorizontalPadding) / containerSize.width
      : 1;
  const heightScale =
    viewportSize.height > 0
      ? (viewportSize.height - viewportVerticalPadding) / containerSize.height
      : 1;
  const surfaceScale = Math.min(1, widthScale, heightScale);
  const renderedContainerSize = useMemo(
    () => ({
      width: Math.max(1, Math.round(containerSize.width * surfaceScale)),
      height: Math.max(1, Math.round(containerSize.height * surfaceScale)),
    }),
    [containerSize.height, containerSize.width, surfaceScale]
  );
  const renderedCropAreaSize = useMemo(
    () => ({
      width: Math.max(1, Math.round(cropAreaSize.width * surfaceScale)),
      height: Math.max(1, Math.round(cropAreaSize.height * surfaceScale)),
    }),
    [cropAreaSize.height, cropAreaSize.width, surfaceScale]
  );
  const renderedMediaSize = useMemo(() => {
    if (!mediaSize) {
      return null;
    }

    const containerAspect = renderedContainerSize.width / renderedContainerSize.height;

    if (mediaAspect < containerAspect) {
      return {
        height: Math.max(1, renderedContainerSize.width / mediaAspect),
        width: renderedContainerSize.width,
      };
    }

    return {
      height: renderedContainerSize.height,
      width: Math.max(1, renderedContainerSize.height * mediaAspect),
    };
  }, [mediaAspect, mediaSize, renderedContainerSize.height, renderedContainerSize.width]);
  const cropOverlayHoleRadius = Math.max(1, Math.round(renderedCropAreaSize.width / 2) - 2);
  const overlayCenterX = renderedMediaSize
    ? `${((renderedMediaSize.width / 2 - crop.x / zoom) / renderedMediaSize.width) * 100}%`
    : "50%";
  const overlayCenterY = renderedMediaSize
    ? `${((renderedMediaSize.height / 2 - crop.y / zoom) / renderedMediaSize.height) * 100}%`
    : "50%";
  const cropOverlayBackground = `radial-gradient(circle ${cropOverlayHoleRadius}px at ${overlayCenterX} ${overlayCenterY}, transparent 0, transparent ${cropOverlayHoleRadius}px, rgba(0, 0, 0, 0.3) ${cropOverlayHoleRadius + 1}px)`;
  const cropActionPanelRight = `calc((100% - ${renderedCropAreaSize.width}px) / 2 - 6rem)`;

  useEffect(() => {
    if (!imageSrc || !initialCroppedAreaPixels || !mediaSize || initialCropAppliedRef.current) {
      return;
    }

    const { crop: restoredCrop } = getInitialCropFromCroppedAreaPixels(
      initialCroppedAreaPixels,
      mediaSize,
      0,
      renderedCropAreaSize,
      MIN_ZOOM,
      MAX_ZOOM
    );

    setCrop(restoredCrop);
    setZoom(INITIAL_ZOOM);
    initialCropAppliedRef.current = true;
  }, [imageSrc, initialCroppedAreaPixels, mediaSize, renderedCropAreaSize]);

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const handleApply = async () => {
    if (!imageSrc || !croppedAreaPixels || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      onClose();
      await onApplied({
        imageCrop: {
          croppedAreaPixels,
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={SURFACE_CLASS_NAME}>
      <div className="relative overflow-visible rounded-[1rem] text-sm text-foreground ">
        <div
          className={cn("relative overflow-visible", !hasImage && "min-w-[16rem]")}
          style={{
            width: `${renderedContainerSize.width}px`,
            height: `${renderedContainerSize.height}px`,
          }}
        >
          {hasImage ? (
            <>
              <Cropper
                key={cropKey}
                image={imageSrc ?? undefined}
                crop={crop}
                cropShape="round"
                aspect={1}
                cropSize={renderedCropAreaSize}
                showGrid={false}
                zoom={zoom}
                minZoom={1}
                maxZoom={1}
                zoomWithScroll={false}
                onCropChange={setCrop}
                onZoomChange={() => {
                  setZoom(INITIAL_ZOOM);
                }}
                onCropComplete={(_, nextCroppedAreaPixels) => {
                  setCroppedAreaPixels(nextCroppedAreaPixels);
                }}
                onMediaLoaded={(mediaSize) => {
                  setMediaSize(mediaSize);
                  setMediaAspect(mediaSize.naturalWidth / mediaSize.naturalHeight);
                }}
                objectFit="cover"
                restrictPosition
                style={{
                  containerStyle: {
                    width: `${renderedContainerSize.width}px`,
                    height: `${renderedContainerSize.height}px`,
                    borderRadius: "1rem",
                    overflow: "visible",
                  },
                  cropAreaStyle: {
                    borderWidth: "3px",
                    borderStyle: "solid",
                    borderColor: "black",
                    color: "transparent",
                  },
                  mediaStyle: {
                    borderRadius: "8px",
                    boxShadow: "0 18px 40px rgba(0, 0, 0, 0.18)",
                  },
                }}
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-1/2 z-[1] rounded-[8px]"
                style={{
                  height: renderedMediaSize ? `${renderedMediaSize.height}px` : "100%",
                  backgroundImage: cropOverlayBackground,
                  borderRadius: "8px",
                  transform: `translate(-50%, -50%) translate(${crop.x}px, ${crop.y}px) scale(${zoom})`,
                  transformOrigin: "center center",
                  width: renderedMediaSize ? `${renderedMediaSize.width}px` : "100%",
                }}
              />
            </>
          ) : (
            <div className="flex size-full items-center justify-center bg-muted/40 text-muted-foreground"></div>
          )}

          <aside
            className="absolute top-1/2 z-10 space-x-2 -translate-y-1/2"
            style={{
              right: cropActionPanelRight,
            }}
          >
            <Button
              type="button"
              size="icon-lg"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-full border-border bg-background text-black shadow-md"
              aria-label="Cancel crop"
            >
              <XIcon className="size-5 stroke-3" />
            </Button>

            <Button
              type="button"
              size="icon-lg"
              onClick={handleApply}
              disabled={!canApply || isSubmitting}
              className="brand-success-button rounded-full px-3 shadow-md"
              aria-label="Apply crop"
            >
              <CheckIcon className="size-5 stroke-3" />
            </Button>
          </aside>
        </div>
      </div>
    </div>
  );
}
