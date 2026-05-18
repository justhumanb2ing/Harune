import type { Variants } from "motion/react";
import * as motion from "motion/react-client";
import Link from "next/link";
import type { ListProfilePages200PagesItem } from "@/lib/api/generated/http/schemas/profile-api";
import { absoluteUrl } from "@/lib/seo";

const variants: Variants = {
  hidden: {
    opacity: 0,
    rotate: -8,
    scale: 0.68,
    y: 36,
  },
  visible: {
    opacity: 1,
    rotate: -6,
    scale: 1,
    transition: {
      bounce: 0.42,
      damping: 11,
      mass: 0.75,
      stiffness: 420,
      type: "spring",
    },
    y: 0,
  },
};

type ExploreSectionProps = {
  pages: ListProfilePages200PagesItem[];
};

const resolveImageUrl = (image: string | null) => {
  if (!image) return null;

  try {
    return new URL(image).toString();
  } catch {
    return absoluteUrl(image.startsWith("/") ? image : `/${image}`);
  }
};

export default function ExploreSection({ pages }: ExploreSectionProps) {
  return (
    <section className="h-full flex flex-col">
      <header className="flex-1 flex flex-col justify-center items-center mt-8 px-6 pt-16 pb-8">
        <div className="container max-w-7xl flex flex-col gap-4">
          <h2 className="text-3xl font-extrabold tracking-tight lg:text-4xl text-primary text-pretty">
            Explore beautiful pages crafted by others
          </h2>
          {/*<h3 className="text-xl">See others beautifl pages</h3>*/}
        </div>
        
      </header>
      <main className="flex-1 px-6 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 ">
          {pages.length > 0 ? (
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {pages.map((page) => {
                const imageUrl = resolveImageUrl(page.image);
                const displayName = page.name ?? page.handle;
                return (
                  <Link
                    key={page.id}
                    href={`/${page.handle}`}
                    className="group aspect-11/10 flex flex-col justify-center items-center gap-4 overflow-hidden bg-secondary/60 p-4 rounded-xl transition-transform duration-200 hover:-translate-y-1 relative"
                  >
                    <div className="relative aspect-square size-28 overflow-hidden bg-muted/40 rounded-full surface-bevel">
                      {imageUrl ? (
                        // biome-ignore lint/performance/noImgElement: This above-the-fold public image should load eagerly without next/image remount flicker.
                        <img
                          alt={displayName}
                          className="absolute inset-0 block h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                          decoding="async"
                          fetchPriority="high"
                          loading="eager"
                          src={imageUrl}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-secondary"></div>
                      )}
                    </div>

                    <div className="w-full min-w-0">
                      <p className="w-full min-w-0 truncate text-center text-lg font-semibold tracking-tight">
                        {displayName}
                      </p>
                    </div>

                    {/*<p className="absolute bottom-3 right-3 line-clamp-1 text-sm text-foreground rounded-md p-1 truncate">{handle}</p>*/}
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-[16rem] items-center justify-center rounded-[1.5rem] px-6 py-12 text-center">
              <div className="max-w-sm space-y-2">
                <p className="text-base font-medium">Nothing has been made</p>
                <p className="text-sm leading-6 text-muted-foreground">
                  Profiles will appear here once creators publish their pages.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </section>
  );
}
