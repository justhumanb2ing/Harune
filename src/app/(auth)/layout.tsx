import * as motion from "motion/react-client";
import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AuthLayoutProps {
  children: ReactNode;
}

type ImageBox = {
  alt: string;
  className: string;
  height: number;
  offsetX: number;
  offsetY: number;
  rotate: number;
  src: string;
  width: number;
};

type CollageSlot = Pick<ImageBox, "height" | "rotate" | "width"> & {
  className: string;
  offsetX: number;
  offsetY: number;
};

const onboardingAsideImages = [
  {
    src: "https://cdn.harune.me/public/assets/aside-asset/onboarding-image-1.png",
    alt: "Onboarding Image 1",
  },
  {
    src: "https://cdn.harune.me/public/assets/aside-asset/onboarding-image-2.png",
    alt: "Onboarding Image 2",
  },
  {
    src: "https://cdn.harune.me/public/assets/aside-asset/onboarding-image-3.png",
    alt: "Onboarding Image 3",
  },
  {
    src: "https://cdn.harune.me/public/assets/aside-asset/onboarding-image-4.png",
    alt: "Onboarding Image 4",
  },
  {
    src: "https://cdn.harune.me/public/assets/aside-asset/onboarding-image-5.png",
    alt: "Onboarding Image 5",
  },
  {
    src: "https://cdn.harune.me/public/assets/aside-asset/onboarding-image-6.png",
    alt: "Onboarding Image 6",
  },
  {
    src: "https://cdn.harune.me/public/assets/aside-asset/onboarding-image-7.png",
    alt: "Onboarding Image 7",
  },
] satisfies Array<{ alt: string; src: string }>;

const onboardingAsideSlots: CollageSlot[] = [
  {
    className: "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
    height: 180,
    offsetX: -152,
    offsetY: -98,
    rotate: 18,
    width: 240,
  },
  {
    className: "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
    height: 252,
    offsetX: 0,
    offsetY: -80,
    rotate: -20,
    width: 168,
  },
  {
    className: "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
    height: 208,
    offsetX: 110,
    offsetY: -80,
    rotate: 6,
    width: 156,
  },
  {
    className: "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
    height: 192,
    offsetX: -88,
    offsetY: 60,
    rotate: -10,
    width: 144,
  },
  {
    className: "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
    height: 268,
    offsetX: 250,
    offsetY: 24,
    rotate: 10,
    width: 150,
  },
  {
    className: "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
    height: 234,
    offsetX: -200,
    offsetY: 88,
    rotate: -18,
    width: 156,
  },
  {
    className: "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
    height: 206,
    offsetX: 80,
    offsetY: 158,
    rotate: -2,
    width: 260,
  },
];

const onboardingAsideImageBoxes: ImageBox[] = onboardingAsideImages.map((box, index) => ({
  ...box,
  ...onboardingAsideSlots[index],
}));

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="relative h-lvh overflow-x-clip bg-background">
      <div className="mx-auto grid h-full w-full max-w-[96rem] min-w-0 grid-cols-1 items-center gap-8 px-6 overflow-y-visible xl:grid-cols-[minmax(0,1fr)_clamp(24rem,28vw,34rem)] xl:gap-16 xl:px-8">
        <div className="relative h-full min-w-0 flex-1 overflow-hidden">{children}</div>
        <aside className="hidden h-full min-h-full xl:block">
          <section className="relative h-full min-h-[860px]">
            <motion.div
              className="relative h-full w-full"
              viewport={{ once: true, margin: "-120px" }}
            >
              {onboardingAsideImageBoxes.map((image, index) => (
                <motion.div
                  key={image.src}
                  className={cn(
                    "absolute overflow-hidden rounded-[1.75rem] bg-background p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.16)]",
                    image.className
                  )}
                  initial={{
                    opacity: 0,
                    rotate: image.rotate - 6,
                    scale: 0.92,
                    x: image.offsetX,
                    y: image.offsetY + 18,
                  }}
                  animate={{
                    opacity: 1,
                    rotate: image.rotate,
                    scale: 1,
                    x: image.offsetX,
                    y: image.offsetY,
                  }}
                  whileHover={{
                    rotate: image.rotate + (image.rotate > 0 ? 4 : -4),
                    scale: 1.03,
                  }}
                  transition={{
                    damping: 20,
                    mass: 0.6,
                    stiffness: 300,
                    type: "spring",
                  }}
                  style={{
                    height: image.height,
                    width: image.width,
                    zIndex: index + 1,
                  }}
                >
                  <Image
                    alt={image.alt}
                    className="h-full w-full rounded-[1.5rem] object-cover"
                    height={image.height}
                    src={image.src}
                    unoptimized
                    width={image.width}
                  />
                </motion.div>
              ))}
            </motion.div>
          </section>
        </aside>
      </div>
    </main>
  );
}
