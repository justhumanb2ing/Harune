"use client";

import Link from "next/link";
import { useListProfilePages } from "@/lib/api/generated/http/profile-api/profile-api";
import { absoluteUrl } from "@/lib/seo";

const resolveImageUrl = (image: string | null) => {
  if (!image) return null;

  try {
    return new URL(image).toString();
  } catch {
    return absoluteUrl(image.startsWith("/") ? image : `/${image}`);
  }
};

export default function ExploreSection() {
  const profilePagesQuery = useListProfilePages({
    request: { cache: "no-store" },
  });
  const pages = profilePagesQuery.data?.status === 200 ? profilePagesQuery.data.data.pages : [];

  return (
    <section className="flex h-full flex-col">
      <header className="flex flex-1 flex-col items-center justify-center px-6 py-8 pt-12">
        <div className="container flex max-w-7xl flex-col gap-4">
          <h2 className="text-primary text-3xl font-extrabold tracking-tight text-pretty lg:text-4xl">
            Explore beautiful pages crafted by others
          </h2>
          {/*<h3 className="text-xl">See others beautifl pages</h3>*/}
        </div>
      </header>
      <main className="flex-1 px-6 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
          {pages.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {pages.map((page) => {
                const imageUrl = resolveImageUrl(page.image);
                const displayName = page.name ?? page.handle;

                return (
                  <Link
                    key={page.id}
                    href={`/${page.handle}`}
                    className="group relative flex aspect-3/4 flex-col items-center justify-start gap-4 overflow-hidden rounded-xl bg-secondary/80 p-4 transition-transform duration-200 hover:-translate-y-1 lg:aspect-square"
                  >
                    <div className="relative aspect-square size-20 overflow-hidden bg-muted/40 rounded-full">
                      {imageUrl ? (
                        <img
                          alt={displayName}
                          className="absolute inset-0 block h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                          decoding="async"
                          fetchPriority="high"
                          loading="eager"
                          src={imageUrl}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-input"></div>
                      )}
                    </div>

                    <div className="w-full min-w-0 flex flex-col gap-1">
                      <p className="w-full min-w-0 truncate text-center text-lg font-semibold tracking-tight">
                        {displayName}
                      </p>
                      <p className="line-clamp-4 text-center text-sm">{page.bio}</p>
                    </div>
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
