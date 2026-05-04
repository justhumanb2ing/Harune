import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="relative h-lvh flex flex-row bg-background">
      <div className="relative h-full flex-2 overflow-hidden">
        {/* Replace with Logo */}
        <aside className="absolute top-5 left-5 z-10">
          <Link
            href={"/"}
            aria-label="Close authentication"
            className="font-extrabold tracking-tighter text-3xl"
          >
            Harune
          </Link>
        </aside>

        {children}
      </div>
      <section className="h-full flex-3 hidden xl:block">
        <div className="h-full flex items-center justify-center">
          <Image
            src="https://pub-cdb24d695a3d4aa08aa10719325ca3bd.r2.dev/public/assets/layout-side-03.png"
            alt="image"
            width={300}
            height={300}
            className="object-contain w-full h-[600px]"
            unoptimized
          />
        </div>
      </section>
    </main>
  );
}
