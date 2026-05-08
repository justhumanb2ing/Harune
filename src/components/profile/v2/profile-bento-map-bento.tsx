"use client";

import { ArrowCircleUpRightIcon } from "@phosphor-icons/react";
import { useCallback, useState } from "react";
import {
  Map as BentoMap,
  MapControls,
  MapMarker,
  type MapViewport,
  MarkerContent,
} from "@/components/ui/map";
import type { ProfileBentoItem } from "@/lib/profile/types";
import { cn } from "@/lib/utils";

type ProfileBentoMapBentoProps = {
  item: Extract<ProfileBentoItem, { type: "map" }>;
  mode: "editable" | "readonly";
  isInteractionEnabled?: boolean;
  preventNavigation?: boolean;
  onChange?: (item: ProfileBentoItem) => void;
};

const toGoogleMapsUrl = (latitude: number, longitude: number) =>
  `https://www.google.com/maps?q=${latitude.toFixed(6)},${longitude.toFixed(6)}`;

const MAP_INTERACTION_OPTIONS = {
  dragRotate: false,
  keyboard: false,
  scrollZoom: false,
  touchPitch: false,
} as const;

const LEEVE_MAP_STYLE = "/assets/leeve-mapbox-inspired-carto-maplibre-style.json";
const LEEVE_MAP_STYLES = {
  light: LEEVE_MAP_STYLE,
  dark: LEEVE_MAP_STYLE,
} as const;

function MapPulseMarker({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative flex size-8 items-center justify-center rounded-full bg-white shadow-[0_8px_24px_rgb(0_0_0_/_0.22)]",
        className
      )}
    >
      <span className="absolute -z-10 size-12 animate-ping rounded-full bg-blue-500 opacity-50 [animation-duration:2.4s]" />
      <span className="relative size-[24px] rounded-full bg-blue-500 shadow-sm" />
    </span>
  );
}

function MapPinMarker() {
  return <MapPulseMarker />;
}

export function ProfileBentoMapBento({
  item,
  mode,
  isInteractionEnabled = false,
  preventNavigation = false,
  onChange,
}: ProfileBentoMapBentoProps) {
  const [viewport, setViewport] = useState<MapViewport>({
    bearing: 0,
    center: [item.content.longitude, item.content.latitude],
    pitch: 0,
    zoom: item.content.zoom,
  });

  const isEditable = mode === "editable";

  const updateLocation = useCallback(
    (nextViewport: MapViewport) => {
      if (!isEditable || !isInteractionEnabled) {
        return;
      }

      const [longitude, latitude] = nextViewport.center;

      setViewport(nextViewport);
      onChange?.({
        ...item,
        content: {
          ...item.content,
          latitude,
          longitude,
          zoom: Math.round(nextViewport.zoom),
          url: toGoogleMapsUrl(latitude, longitude),
        },
      });
    },
    [isEditable, isInteractionEnabled, item, onChange]
  );

  return (
    <article
      className={cn(
        "relative size-full overflow-hidden rounded-[1.5rem] bg-muted transition-all duration-200 ease-out",
        isEditable && isInteractionEnabled ? "grid-action ring-4 ring-black" : ""
      )}
    >
      <BentoMap
        className="size-full"
        styles={LEEVE_MAP_STYLES}
        onViewportChange={updateLocation}
        viewport={
          isEditable
            ? viewport
            : {
                center: [item.content.longitude, item.content.latitude],
                zoom: item.content.zoom,
              }
        }
        {...MAP_INTERACTION_OPTIONS}
        dragPan={isEditable && isInteractionEnabled}
        doubleClickZoom={isEditable && isInteractionEnabled}
        touchZoomRotate={isEditable && isInteractionEnabled}
      >
        {isEditable && isInteractionEnabled ? (
          <MapControls
            position="top-right"
            showLocate
            showZoom
            onLocate={({ latitude, longitude }) => {
              updateLocation({
                ...viewport,
                center: [longitude, latitude],
                zoom: Math.max(viewport.zoom, 14),
              });
            }}
          />
        ) : !isEditable ? (
          <MapMarker latitude={item.content.latitude} longitude={item.content.longitude}>
            <MarkerContent className="pointer-events-none">
              <MapPinMarker />
            </MarkerContent>
          </MapMarker>
        ) : null}
      </BentoMap>
      {item.content.caption ? (
        <p className="pointer-events-none absolute bottom-3 left-3 line-clamp-2 max-w-[calc(100%-4.5rem)] rounded-md bg-black/25 px-2 py-1 font-medium text-sm text-white backdrop-blur-sm">
          {item.content.caption}
        </p>
      ) : null}
      {isEditable ? (
        <input
          aria-label="Map caption"
          className="grid-action absolute bottom-3 left-3 max-w-[calc(100%-4.5rem)] rounded-md bg-black/35 px-2 py-2 font-medium text-sm text-white outline-none backdrop-blur-sm placeholder:text-white/70"
          onChange={(event) => {
            onChange?.({
              ...item,
              content: {
                ...item.content,
                caption: event.target.value,
              },
            });
          }}
          placeholder="Caption"
          value={item.content.caption}
        />
      ) : (
        <a
          aria-label="Open location in Google Maps"
          className={cn(
            "absolute right-3 bottom-4 flex size-7 items-center justify-center rounded-full bg-white text-black shadow-md backdrop-blur-sm transition-colors hover:bg-white/60",
            "grid-action"
          )}
          href={item.content.url}
          onClick={preventNavigation ? (event) => event.preventDefault() : undefined}
          rel="noreferrer"
          target="_blank"
        >
          <ArrowCircleUpRightIcon aria-hidden className="size-7" weight="fill" />
        </a>
      )}
    </article>
  );
}
